import { Client } from "@pepperi-addons/debug-server/dist"
import { ImportFileBaseCommand } from "./import-file-base-command";

export class SmallFileCommand extends ImportFileBaseCommand {

    constructor(client: Client){
        super(client, 'Small Size File Test')
        this.numberOfEntities = 10;
    }
}
