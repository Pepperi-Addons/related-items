import { Client } from "@pepperi-addons/debug-server/dist";
import { CPISchemeCommand } from "./cpi-scheme-command";

export class BigCPISchemeCommand extends CPISchemeCommand {

    constructor(client: Client){
        super(client);
        this.numberOfEntities = 500;
        this.timeToWait = 10000;
        this.title = 'Big_CPI_Scheme_Command'
    }
}
