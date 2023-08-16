import { PapiClient } from '@pepperi-addons/papi-sdk/dist/papi-client';
import { AddonFile, FileImportInput, TemporaryFile } from '@pepperi-addons/papi-sdk';
import { Client } from '@pepperi-addons/debug-server/dist';
import { v4 as uuid } from 'uuid';
import { Agent } from 'https';
import fetch from 'node-fetch';
import { HttpMethod, PFS_TABLE_NAME } from '../../../shared/entities';

export class PfsService {

    addonUUID: string;

    constructor(private papiClient: PapiClient, client: Client) {
        this.addonUUID = client.AddonUUID;
    }

    // convert the mock data to a csv file that can be imported(using PFS)
    async generateFileToImport(mockData) {
        //convert mockdata to csv string
        const csvFile: string = await this.convertToCSV(mockData);
        // create empty temporary file
        const temporaryFile: TemporaryFile = await this.getTemporaryFile();
        // add the data into the temporary file anf upload it to pfs
        await this.uploadObjectToS3(temporaryFile.PutURL, csvFile);
        const pfsFile = await this.createPfsFile(temporaryFile.TemporaryFileURL);
            const file: FileImportInput = {
                'URI': pfsFile.URL!,
                'OverwriteObject': true,
                'Delimiter': ',',
                "Version": "1.0.3"
            }
            return file;
    }

    async createPfsFile(temporaryFileUrl: string) {
        const expirationDateTime = new Date();
        expirationDateTime.setDate(expirationDateTime.getDate() + 1);
        const body: AddonFile = {
            "Key": `/tempBulkAPI/${ uuid() }.csv`,
            "MIME": "text/csv",
            "ExpirationDateTime": expirationDateTime,
            "TemporaryFileURLs": [temporaryFileUrl]
        }
        return await this.papiClient.addons.pfs.uuid(this.addonUUID).schema(PFS_TABLE_NAME).post(body);
    }

    convertToCSV(body: any[]) {
        const header = Object.keys(body[0]).join(',');
        body.map(row => row.RelatedItems = `"[${row.RelatedItems.map(item => `'${item}'`)}]"`)
        const rows = body.map(row => Object.values(row).join(','));
        return [header, ...rows].join('\n')
    }

    async getTemporaryFile() {
        return await this.papiClient.addons.pfs.temporaryFile();
    }

    async uploadObjectToS3(fileURL: string, csv: string) {
        return this.apiCall('PUT', fileURL, Buffer.from(csv)).then((res) => res.text());
    }

    async apiCall(method: HttpMethod, url: string, body: any = undefined) {
        const agent = new Agent({
            rejectUnauthorized: false,
        })

        const options: any = {
            method: method,
            agent: agent
        };

        if (body) {
            options.body = body;
        }

        const res = await fetch(url, options);

        if (!res.ok) {
            // try parsing error as json
            let error = '';
            try {
                error = JSON.stringify(await res.json());
            } catch { }

            throw new Error(`${url} failed with status: ${res.status} - ${res.statusText} error: ${error}`);
        }
        return res;
    }
}
