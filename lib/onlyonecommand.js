'use babel';

const rawCommandStart = "/summon FallingSand ~ ~1 ~ {Block:minecraft:barrier,Time:1,Passengers:[{id:FallingSand,Block:minecraft:redstone_block,Time:1,Passengers:[{id:FallingSand,Block:minecraft:activator_rail,Time:1},";
const rawCommandEnd = "{id:MinecartCommandBlock,Command:summon MinecartCommandBlock ~ ~4 ~ {Command:fill ~ ~-3 ~ ~ ~ ~ minecraft:air}},{id:MinecartCommandBlock,Command:kill @e[r=1,type=MinecartCommandBlock]}]}]}";

export default {

  toOnlyOneCommand(commands) {
    let ooc = rawCommandStart;
    let lines = commands.split("\n");

    // Remove empty lines
    lines = lines.filter(function(command) {
        command = command.trim();
        return command !== '';
    });

    const dx = atom.config.get("mcide.onlyOneCommand.dimensions.x");
    const dz = atom.config.get("mcide.onlyOneCommand.dimensions.z");

    let x = atom.config.get("mcide.onlyOneCommand.coordinates.x");
    let y = atom.config.get("mcide.onlyOneCommand.coordinates.y");
    let z = atom.config.get("mcide.onlyOneCommand.coordinates.z");

    if (atom.config.get("mcide.onlyOneCommand.coordinates.relative")) {
      ooc += this.getCommand("fill ~" + x + " ~" + y + " ~" + z + " ~" +
      (x + dx - 1) + " ~" + y + " ~" + (z + dz - 1) +
      " minecraft:repeating_command_block 1 replace {auto:1b}");
    } else {
      ooc += this.getCommand("fill " + x + " " + y + " " + z + " " +
      (x + dx) + " " + y + " " + (z + dz) +
      " minecraft:repeating_command_block 1 replace {auto:1b}");
    }



    let layers = Math.ceil(lines.length / (dx * dz));

    let cx = x;
    let cy = y + 1;
    let cz = z;

    lines.forEach((command) => {
      command = command.trim();

      if (atom.config.get("mcide.onlyOneCommand.coordinates.relative")) {
        ooc += this.getCommand("setblock ~" + cx + " ~" + cy + " ~" + cz +
        " minecraft:chain_command_block 1 replace {auto:1b,Command:" + command + "}");
      } else {
        ooc += this.getCommand("setblock " + cx + " " + cy + " " + cz +
        " minecraft:chain_command_block 1 replace {auto:1b,Command:" + command + "}");
      }

      cy++;

      if (cy - (y + 1) >= layers) {
        cy = y + 1;
        cx++;
      }

      if (cx - x >= dx) {
        cx = x;
        cz++;
      }
    });

    ooc += rawCommandEnd;

    atom.clipboard.write(ooc);

    atom.notifications.addInfo("Only one command copied to clipboard", {
      detail: ooc.substring(0, 20) + "...",
      dismissable: true
    });

  },

  getCommand(command) {
    return "{id:MinecartCommandBlock,Command:" + command + "},";
  }

};
