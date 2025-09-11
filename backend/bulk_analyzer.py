# backend/bulk_analyzer.py
import asyncio
import logging
from typing import List, Dict

from . import gemini_api, bedrock_api

logger = logging.getLogger(__name__)

async def analyze_multiple_jobs(jobs: List[Dict], profile_data: Dict, api_config: Dict) -> List[Dict]:
    """
    Analyzes a list of job postings in parallel against a freelancer's profile, with rate limiting.
    """
    logger.info(f"Starting bulk analysis for {len(jobs)} jobs.")

    provider = api_config.get("provider", "google")
    logger.info(f"Using AI provider: {provider} for bulk analysis.")

    all_results = []
    batch_size = 10  # Rate limit, adjust as needed

    for i in range(0, len(jobs), batch_size):
        batch = jobs[i:i + batch_size]
        logger.info(f"Processing batch {i//batch_size + 1}/{(len(jobs) + batch_size - 1)//batch_size}...")
        
        tasks = []
        for job in batch:
            if provider == "google":
                task = asyncio.create_task(gemini_api.get_job_analysis(job, profile_data))
            elif provider == "aws":
                task = asyncio.create_task(bedrock_api.get_job_analysis(job, profile_data, api_config))
            else:
                # If provider is unsupported, log an error for the job and skip it.
                logger.error(f"Unsupported AI provider: {provider} for job {job.get('title')}")
                continue
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        all_results.extend(zip(batch, results))

        if i + batch_size < len(jobs):
            logger.info("Rate limit pause: waiting for 60 seconds before next batch...")
            await asyncio.sleep(60)

    successful_analyses = []
    for job, result in all_results:
        if isinstance(result, Exception):
            logger.error(f"Error analyzing job {job.get('title')}: {result}")
        else:
            result['job_data'] = job
            successful_analyses.append(result)
    
    logger.info(f"Successfully analyzed {len(successful_analyses)} out of {len(jobs)} jobs.")

    # Rank the results based on the suitability_score
    ranked_analyses = sorted(
        [res for res in successful_analyses if res.get('suitability_score') is not None],
        key=lambda x: x['suitability_score'],
        reverse=True
    )

    return ranked_analyses
