import { ItemRelations } from "../../../../../shared/entities";
import { ImportBaseCommand } from "../import-base-command";
import { Client } from "@pepperi-addons/debug-server/dist";
import { PfsService } from "../../../services/pfs-service";

// base class for import file tests
export class ImportFileBaseCommand extends ImportBaseCommand {
    pfsService: PfsService;

    constructor(client: Client, title){
        super(client, title)

        this.numberOfEntities = 10;
        this.pfsService = new PfsService(this.papiClient, client);
    }

    async testAction() {
        // convert the mock data to a csv file that can be imported
        const file = await this.pfsService.generateFileToImport(this.mockItemRelationsData);
        return await this.resourceService.importFile(file);
     }

     async processTestAction(testActionRes) {
        const ansFromAuditLog: string = await this.resourceService.callAuditLog(testActionRes.ExecutionUUID);
        const resultObject = JSON.parse(ansFromAuditLog);
        return resultObject.LinesStatistics.Inserted;
    }

    async test(res: any, data: any, expect: Chai.ExpectStatic): Promise<any> {
        expect(data).to.equal(this.numberOfEntities);
    }
}
