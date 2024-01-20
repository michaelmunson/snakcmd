import { ArgvMap } from "./argv";
import { ExitCode, Config, CommandOptionConfig, Optional } from "./types";

class Command {
    name: string[]
    action: (value:string|null, argvMap:ArgvMap) => void|Promise<any>
    options:CommandOptionConfig = {
        description: ""
    }
    constructor(name:string|string[], action: (value:string|null, argvMap:ArgvMap) => void|Promise<any>, options?:Optional<CommandOptionConfig>){
        name = (typeof name === "string") ? [name] : name;
        this.name = (this instanceof Option)
                    ? name.sort((a,b) => a.length - b.length)
                    : name.sort((a,b) => b.length - a.length);
        this.action = action;
        if (options) this.options = {...this.options, ...options}; 
    }
    is(name:string){
        return this.name.includes(name);
    }
}
class Option extends Command {
    readonly shortOpt = this.name[0];
    readonly longOpt = this.name[1];
    static isShortOpt(name: string){
        return name.startsWith("-") && !Option.isLongOpt(name);
    }
    static isLongOpt(name:string){
        return name.startsWith("--");
    }
}


export class SnakCMD {
    commands: Command[] = []
    options: Option[] = [
        new Option(['-h', '--help'], () => this.help(), {description: "Print list of commands/options"})
    ]
    private config: Config = {
        argvConvert: true,
        splitComboOpts: true,
        onUnrecognized: arg => {
            if (arg.startsWith("-")){
                this.help(`Unrecognized option "${arg}"`)
            } else {
                this.help(`Unrecognized command "${arg}"`)
            }
            process.exit(1);
        },
    }
    constructor(config?:Optional<Config>){
        if (config) this.config = {...this.config, ...config};
    }
    command(name:string|string[], action:Command['action'], options?:Command['options']){
        const cmd = new Command(name, action, options);
        this.commands.push(cmd);
        return this;
    }
    option(name:string|string[], action:Option['action'], options?:Option['options']){
        const formatOpt = (name:string) => {
            if (!name.startsWith("-")){
                if (name.length > 1){
                    name = "--"+name
                } else {
                    name = "-"+name; 
                }
            }
            return name;
        }
        if (typeof name === "string"){
            name = formatOpt(name);
        } else {
            name.map(n => formatOpt(n)); 
        }
        const opt = new Option(name, action, options);
        this.options.push(opt);
        return this; 
    }
    private help(message?: string){
        if (this.config.helpMessage){
            console.log(this.config.helpMessage);
            process.exit(0);
        }
        if (message) console.log(message);
        const cmdopts = [...this.commands, ...this.options];
        const spaceLen = cmdopts.reduce((prev, curr) => curr.name.length > prev ? curr.name.length : prev, 0);
        for (const {name, options:{description}} of cmdopts) {
            console.log(`[${name.join(", ")}] ${" ".repeat(spaceLen)} ${description}`)
        }
    }
    private isCommand(command:string){
        for (const cmd of this.commands){
            if (cmd.is(command)){
                return true; 
            }
        }
        return false;
    }
    private isOption(option:string){
        if (option.includes("=")){
            option = option.split("=")[0];
        }
        for (const opt of this.options){
            if (opt.is(option)){
                return true;
            }
        }
        return false;
    }
    private getCommand(command:string){
        for (const cmd of this.commands){
            if (cmd.is(command)){
                return cmd; 
            }
        }
        throw new Error();
    }
    private getOption(option:string){
        for (const opt of this.options){
            if (opt.is(option)){
                return opt;
            }
        }
        throw new Error();
    }
    parse(argv:string[]=process.argv.slice(2)) : ArgvMap {
        argv = argv.flatMap(arg => {
            if (Option.isShortOpt(arg) && arg.length > 2){
                return arg.slice(1).split('').map(a => `-${a}`);
            }
            return arg;
        });
        const map = new ArgvMap(); 
        let lastArg = "";
        for (const arg of argv){
            if (this.isOption(arg)){
                if (Option.isLongOpt(arg)){
                    if (arg.includes("=")){
                        const opt = (this.config.argvConvert) ? this.getOption(arg.split("=")[0]).shortOpt : arg.split("=")[0];
                        const val = arg.split("=").slice(1).join("=");
                        map.set(opt, val);
                        lastArg = "";
                    } else {
                        const opt = (this.config.argvConvert) ? this.getOption(arg).shortOpt : arg;
                        map.set(opt, null);
                        lastArg = opt;
                    }
                } else {
                    map.set(arg, null);
                    lastArg = arg;
                }
            }
            else if (this.isCommand(arg)){
                const cmd = (this.config.argvConvert) ? this.getCommand(arg).name[0] : arg; 
                map.set(cmd, null);
                lastArg = cmd; 
            }
            else {
                if (arg.startsWith("-") || !lastArg){
                    this.config.onUnrecognized(arg);
                } else {
                    map.set(lastArg, arg);
                    lastArg = "";
                }
            }
        }
        return map;
    }
    async run(argv:string[]=process.argv.slice(2), callback?:(argMap:ArgvMap) => ExitCode|Promise<ExitCode>) : Promise<ExitCode> {
        const argvMap = this.parse(argv);
        for (const [name, value] of argvMap){
            let res;
            if (this.isCommand(name)){
                const cmd = this.getCommand(name);
                res = cmd.action(value, argvMap);
            }
            else if (this.isOption(name)){
                const opt = this.getOption(name);
                res = opt.action(value, argvMap);
            }
            if (res instanceof Promise){
                await res;
            }
        }
        if (callback) {
            const cbRes = callback(argvMap);
            if (cbRes instanceof Promise){
                return await cbRes;
            }
            return cbRes;
        } else {
            return 0;
        }
    }
}