import { confirmUpload } from "@/lib/confirmupload";
import { prisma } from "@/lib/prisma";
import "dotenv/config";

const STALE_AFTER_MINUTES = 15;
export async function sweepStaleUpload() {

    const cutoff = new Date(Date.now() - STALE_AFTER_MINUTES * 60 * 1000);

    const staledocuments = await prisma.document.findMany({
        where: { uploadedStatus: "PENDING", createdAt: { lt: cutoff } }, select: { id: true }
    });

    let uploaded = 0;
    let failed = 0;

    for (const doc of staledocuments) {
        const result = await confirmUpload(doc.id);
        if (result.ok) {
            uploaded++;
        } else {
            failed++;
        }
    }
    console.log(`swept ${staledocuments.length} stale pending document ( ${uploaded} uploaded , ${failed} failed)`)
}
sweepStaleUpload();