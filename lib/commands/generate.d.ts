import { Command } from "@oclif/command";
export default class Generate extends Command {
    static description: string;
    static examples: string[];
    static flags: {};
    static args: {
        name: string;
        required: boolean;
        description: string;
    }[];
    run(): Promise<void>;
}
