import { Command, flags } from "@oclif/command";
export default class New extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        help: import("@oclif/parser/lib/flags").IBooleanFlag<void>;
        description: flags.IOptionFlag<string | undefined>;
        version: flags.IOptionFlag<string>;
        author: flags.IOptionFlag<string | undefined>;
        module: flags.IOptionFlag<string>;
    };
    static args: {
        name: string;
        required: boolean;
        description: string;
    }[];
    run(): Promise<void>;
}
