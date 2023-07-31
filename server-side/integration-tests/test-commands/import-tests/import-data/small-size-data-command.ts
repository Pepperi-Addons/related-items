import { Client } from "@pepperi-addons/debug-server/dist"
import { ImportDataBaseCommand } from "./import-data-base-command"

export class SmallDataCommand extends ImportDataBaseCommand {
    
    constructor(client: Client){
        super(client, 'Small Size Data Test')
        this.numberOfEntities = 10;
    }
}