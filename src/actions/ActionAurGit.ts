import * as fs from "fs";
import * as Core from "@actions/core";
import * as Exec from "@actions/exec";
import { resolve } from "path";
import BaseClient from "../utils/BaseClient";
import BaseAction from "../utils/BaseAction";
import BaseGenerator from "../utils/Generators";
import {
  MAIN_REPO_DEST,
  AUR_REPO_GIT_DEST,
  AUR_REPO_GIT_URL,
  VERSION_REGEXP,
} from "../constants";
import { BaseConfig } from "src/utils/Generators";

export default class extends BaseAction {
  constructor(
    protected baseClient: BaseClient,
    private pkgGenerator: BaseGenerator,
    private srcInfoGenerator: BaseGenerator
  ) {
    super(baseClient);
  }

  public async run() {
    const aurRepoRootPath = `../${AUR_REPO_GIT_DEST}`;
    const aurRepoRoot = resolve(process.cwd(), aurRepoRootPath);
    const tag = await this.baseClient.getFigmaLinuxLatestTag();
    const newVersion = tag.replace("v", "");
    const newPkgver = await this.getNewPkgver();
    let newPkgrel = "0";

    const { pkgver, pkgrel } = await this.getCurrentInfo(aurRepoRoot);

    if (pkgver.match(VERSION_REGEXP)![0] === newVersion) {
      Core.warning(
        `Current version (${pkgver}) = new version (${newVersion}).`
      );
      newPkgrel = +pkgrel + 1 + "";
    }

    await fs.promises.rm(aurRepoRoot, {
      force: true,
      recursive: true,
    });
    await this.baseClient.clone(AUR_REPO_GIT_URL, aurRepoRootPath);

    const pkgConfig: BaseConfig = {
      pkgver: newPkgver,
      _pkgver: newVersion,
      pkgrel: newPkgrel,
      arch: ["any"],
      source: ['${_pkgname}"::"git+${url}.git#tag=v${_pkgver}'],
      sha256sums: ["SKIP"],
      conflicts: ["figma-linux", "figma-linux-bin", "figma-linux-git-dev"],
    };
    const srcInfoConfig: BaseConfig = {
      ...pkgConfig,
      source: [
        `figma-linux::git+https://github.com/Figma-Linux/figma-linux.git#tag=${tag}`,
      ],
    };

    delete srcInfoConfig["_pkgver"];

    this.pkgGenerator.config = pkgConfig;
    this.srcInfoGenerator.config = srcInfoConfig;

    const pkgBuffer = this.pkgGenerator.generate();
    const srcInfoBuffer = this.srcInfoGenerator.generate();

    await Promise.all([
      fs.promises.writeFile(`${aurRepoRoot}/PKGBUILD`, pkgBuffer, {
        encoding: "utf-8",
        flag: "w",
      }),
      fs.promises.writeFile(`${aurRepoRoot}/.SRCINFO`, srcInfoBuffer, {
        encoding: "utf-8",
        flag: "w",
      }),
    ]);

    await Exec.exec(`cat ${aurRepoRoot}/PKGBUILD`);
    await Exec.exec(`cat ${aurRepoRoot}/.SRCINFO`);

    // TODO: push to repo
  }

  private async getNewPkgver() {
    let newPkgver = "";

    await Exec.exec("git describe --long --tags --exclude='*[a-z][a-z]*'", [], {
      cwd: MAIN_REPO_DEST,
      listeners: {
        stdout: (data) =>
          (newPkgver = data
            .toString()
            .substring(1)
            .replace(/-([0-9]{1,9})-/, ".r$1.")),
      },
    });

    return newPkgver;
  }

  private async getCurrentInfo(
    aurRepoRoot: string
  ): Promise<{ pkgver: string; pkgrel: string }> {
    const content = await fs.promises.readFile(`${aurRepoRoot}/PKGBUILD`, {
      encoding: "utf-8",
    });
    const lines = content.split("\n");

    return {
      pkgver: lines
        .find((l) => /pkgver=".+"/.test(l))!
        .match(VERSION_REGEXP)![0],
      pkgrel: lines.find((l) => /pkgrel=".+"/.test(l))!.match(/[0-9]{1,5}/)![0],
    };
  }
}