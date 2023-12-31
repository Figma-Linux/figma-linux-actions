import BaseAction from "./utils/BaseAction";
import ActionAur from "./actions/ActionAur";
import ActionAurBin from "./actions/ActionAurBin";
import ActionAurGit from "./actions/ActionAurGit";
import ActionAurDev from "./actions/ActionAurGitDev";
import ActionFlatpak from "./actions/ActionFlatpak";
import ActionLaunchpad from "./actions/ActionLaunchpad";
import FigmaBinPkgBuild from "./utils/Generators/FigmaBinPkgBuild";
import FigmaBinSrcInfo from "./utils/Generators/FigmaBinSrcInfo";
import FigmaGitPkgBuild from "./utils/Generators/FigmaGitPkgBuild";
import FigmaGitSrcInfo from "./utils/Generators/FigmaGitSrcInfo";
import Git from "./Git";
import { ActionInput } from "./constants";

export default class {
  public token: string = "";
  public type: ActionInput = ActionInput.PUBLISH_FLATPAK;

  constructor() {}

  public getAction(): BaseAction {
    switch (this.type) {
      case ActionInput.PUBLISH_AUR: {
        return new ActionAur(
          new Git(this.token),
          new FigmaBinPkgBuild(),
          new FigmaBinSrcInfo()
        );
      }
      case ActionInput.PUBLISH_AUR_BIN: {
        return new ActionAurBin(
          new Git(this.token),
          new FigmaBinPkgBuild(),
          new FigmaBinSrcInfo()
        );
      }
      case ActionInput.PUBLISH_AUR_GIT: {
        return new ActionAurGit(
          new Git(this.token),
          new FigmaGitPkgBuild(),
          new FigmaGitSrcInfo()
        );
      }
      case ActionInput.PUBLISH_AUR_GIT_DEV: {
        return new ActionAurDev(
          new Git(this.token),
          new FigmaGitPkgBuild(),
          new FigmaGitSrcInfo()
        );
      }
      case ActionInput.PUBLISH_FLATPAK: {
        return new ActionFlatpak(new Git(this.token));
      }
      case ActionInput.PUBLISH_LAUNCHPAD: {
        return new ActionLaunchpad(new Git(this.token));
      }
      default: {
        throw new Error(`Provided invalid action type: ${this.type}`);
      }
    }
  }
}
