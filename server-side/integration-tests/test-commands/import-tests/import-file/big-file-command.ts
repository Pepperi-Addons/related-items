import { Client } from "@pepperi-addons/debug-server/dist"
import { ImportFileBaseCommand } from "./import-file-base-command";

export class BigFileCommand extends ImportFileBaseCommand {
    
    constructor(client: Client){
        super(client, 'Big Size File Test')
        this.numberOfEntities = 500;
    }
}