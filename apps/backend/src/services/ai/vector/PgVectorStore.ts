import { PrismaClient } from '@prisma/client';
import { IVectorStore } from './IVectorStore.js';
import { SearchResult } from '../types.js';
import { prisma } from '../../../utils/database.js';

export class PgVectorStore implements IVectorStore {
  private client: PrismaClient;

  constructor() {
    this.client = prisma;
  }

  async addDocument(
    documentId: string,
    content: string,
    vector: number[],
    metadata?: Record<string, any>
  ): Promise<void> {
    // We use raw SQL because Prisma schema has Unsupported("vector")
    // and we need to cast the array to vector type
    const vectorString = `[${vector.join(',')}]`;
    
    // Calculate tokens approximately (or pass it in) - simplistic approx
    const tokenCount = Math.ceil(content.length / 4);
    
    // chunkIndex is needed, assume sequential or managed by caller. 
    // For now, we might need to pass chunkIndex or auto-increment.
    // But the interface doesn't have chunkIndex.
    // I should update the interface or assume 0/auto-generated.
    // However, the schema has chunkIndex as Int.
    // Let's assume the caller manages chunking and we just store one chunk here?
    // Actually, addDocument usually adds ONE chunk. 
    // But we need to know the index. 
    // Let's query max index first or just default to 0 if not provided (but that breaks uniqueness if multiple chunks).
    
    // Better: Let's assume the caller handles the chunking and calls this for each chunk. 
    // I'll auto-increment index for the document.
    
    const lastChunk = await (this.client as any).documentChunk.findFirst({
      where: { documentId },
      orderBy: { chunkIndex: 'desc' },
      select: { chunkIndex: true },
    });
    
    const newIndex = (lastChunk?.chunkIndex ?? -1) + 1;

    await this.client.$executeRaw`
      INSERT INTO "DocumentChunk" ("id", "documentId", "content", "chunkIndex", "tokenCount", "embedding", "createdAt")
      VALUES (
        gen_random_uuid(), 
        ${documentId}, 
        ${content}, 
        ${newIndex}, 
        ${tokenCount}, 
        ${vectorString}::vector, 
        NOW()
      )
    `;
  }

  async similaritySearch(
    queryVector: number[],
    limit: number,
    threshold: number = 0.25,
    documentIds?: string[]
  ): Promise<SearchResult[]> {
    const vectorString = `[${queryVector.join(',')}]`;

    let filterClause = '';
    if (documentIds && documentIds.length > 0) {
      // Correctly format for SQL IN clause: ('id1', 'id2', ...)
      const ids = documentIds.map(id => `'${id}'`).join(',');
      filterClause = `AND dc."documentId" IN (${ids})`;
    }

    const query = `
      SELECT
        dc.id,
        dc."documentId",
        dc.content,
        (1 - (dc.embedding <=> '${vectorString}'::vector)) as similarity
      FROM "DocumentChunk" dc
      WHERE (1 - (dc.embedding <=> '${vectorString}'::vector)) > ${threshold}
      ${filterClause}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;
    
    const results = await this.client.$queryRawUnsafe(query);

    console.log(`🔍 Vector Search: Found ${(results as any[]).length} chunks. Top score: ${(results as any[])[0]?.similarity}`);

    // Map raw results to SearchResult interface
    // Note: queryRaw returns any[], we need to cast
    return (results as any[]).map((row) => ({
      documentId: row.documentId,
      content: row.content,
      score: row.similarity,
      metadata: {}, // Fetch extra metadata if needed from row
    }));
  }

  async deleteDocumentVectors(documentId: string): Promise<void> {
    await (this.client as any).documentChunk.deleteMany({
      where: { documentId },
    });
  }
}