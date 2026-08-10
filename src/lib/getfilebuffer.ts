import { GetObjectCommand } from "@aws-sdk/client-s3";
import { BUCKET_NAME, r2Client } from "./r2";


export async function getFileBuffer(r2Key: string): Promise<Buffer> {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: r2Key });

    const response = await r2Client.send(command);

    if (!response.Body) {
        throw Error(`body no found for this key ${r2Key}`);
    }
    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
}




