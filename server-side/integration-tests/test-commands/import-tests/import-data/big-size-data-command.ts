import { Client } from "@pepperi-addons/debug-server/dist"
import { ImportDataBaseCommand } from "./import-data-base-command"

export class BigDataCommand extends ImportDataBaseCommand {
    constructor(client: Client){
        super(client, 'Big Size Data Test')
        this.numberOfEntities = 500;

    }
}