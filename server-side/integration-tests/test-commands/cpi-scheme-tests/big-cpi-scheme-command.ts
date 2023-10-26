import { Client } from "@pepperi-addons/debug-server/dist";
import { CPISchemeCommand } from "./cpi-scheme-command";

export class BigCPISchemeCommand extends CPISchemeCommand {

    constructor(client: Client){
        super(client, 'Big_CPI_Scheme_Command');
        this.numberOfEntities = 500;
        this.timeToWait = 240000; // 4 minutes in order to wait for PNS
    }
}
