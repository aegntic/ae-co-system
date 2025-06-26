
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db'; // Drizzle client
import { generatedSites } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SiteData } from '@/types'; // Ensure this type matches the DB structure and expected output

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SiteData | { error: string; details?: any; status?: string }>
) {
  const { siteId } = req.query;

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  if (!siteId || typeof siteId !== 'string') {
    return res.status(400).json({ error: 'Site ID is required and must be a string.' });
  }

  try {
    const result = await db.select()
      .from(generatedSites)
      .where(eq(generatedSites.id, siteId))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Site data not found.', status: 'NOT_FOUND' });
    }

    const siteRecord = result[0];

    // Check status and return appropriate response
    if (siteRecord.status === 'PENDING_ANALYSIS' || siteRecord.status === 'ANALYSIS_IN_PROGRESS') {
      return res.status(202).json({ error: 'Site analysis is still in progress.', status: siteRecord.status });
    }
    
    if (siteRecord.status === 'ERROR' && siteRecord.errorMessage) {
         return res.status(500).json({ error: `Error processing site: ${siteRecord.errorMessage}`, status: siteRecord.status });
    }
    
    // Ensure all necessary fields for SiteData are present before constructing the response
    if (!siteRecord.title || !siteRecord.templateId || !siteRecord.sections ) {
        // This case might happen if analysis completed but some data is missing - should be an error state from AI pipeline
        return res.status(500).json({ error: 'Analysis data is incomplete.', status: siteRecord.status || 'INCOMPLETE_DATA' });
    }


    // Transform the database record to the SiteData structure if necessary.
    // Assuming sections and partnerToolRecommendations are stored correctly as JSONB
    // and can be directly used.
    const siteData: SiteData = {
      id: siteRecord.id,
      title: siteRecord.title,
      repoUrl: siteRecord.repoUrl,
      generatedMarkdown: siteRecord.rawMarkdown || '', // Provide a fallback for generatedMarkdown
      sections: siteRecord.sections || [], // Fallback to empty array
      template: siteRecord.templateId as 'TechProjectTemplate' | 'CreativeProjectTemplate', // Cast, ensure this is safe
      partnerToolRecommendations: siteRecord.partnerToolRecommendations || undefined, // Fallback to undefined
      deployed_url: siteRecord.deployedUrl || undefined,
      // Include status and error message if you want the frontend to have more context
      // status: siteRecord.status, 
      // errorMessage: siteRecord.errorMessage
    };
    
    return res.status(200).json(siteData);

  } catch (error: any) {
    console.error(`Error fetching site data for ${siteId}:`, error);
    return res.status(500).json({ error: 'Failed to fetch site data.', details: error.message });
  }
}
    