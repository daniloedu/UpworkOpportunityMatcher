
# backend/bedrock_api.py
import boto3
import os
import json
import logging
from botocore.exceptions import BotoCoreError, ClientError
from . import prompts

logger = logging.getLogger(__name__)

async def get_job_analysis(job_data: dict, profile_data: dict, api_config: dict) -> dict:
    """
    Analyzes a job posting against a freelancer's profile using the AWS Bedrock API.
    """
    logger.info(f"Starting Bedrock analysis for job: {job_data.get('title')}")

    aws_access_key_id = api_config.get("aws_access_key_id")
    aws_secret_access_key = api_config.get("aws_secret_access_key")
    aws_region = api_config.get("aws_region", "us-west-2")

    client_args = {
        "service_name": "bedrock-runtime",
        "region_name": aws_region
    }

    # If the user provides keys in the UI, use them.
    # Otherwise, boto3 will search the environment (e.g., ~/.aws/credentials).
    if aws_access_key_id and aws_secret_access_key:
        logger.info("Using AWS credentials provided in the UI.")
        client_args["aws_access_key_id"] = aws_access_key_id
        client_args["aws_secret_access_key"] = aws_secret_access_key
    else:
        logger.info("Using AWS credentials from environment.")

    try:
        # Create the Bedrock client per request with user-specific or environment credentials
        client = boto3.client(**client_args)

        prompt_text = prompts.JOB_ANALYSIS_PROMPT.format(
            job_data=json.dumps(job_data, indent=2),
            profile_data=json.dumps(profile_data, indent=2)
        )

        # Using the model ID specified by the user.
        model_id = "us.amazon.nova-lite-v1:0"
        messages = [{"role": "user", "content": [{"text": prompt_text}]}]

        # Make the API call
        response = client.converse(
            modelId=model_id,
            messages=messages,
        )
        
        analysis_text = response['output']['message']['content'][0]['text']
        
        # Clean the response text to remove markdown fences if they exist
        if analysis_text.strip().startswith("```json"):
            # Find the first '{' and the last '}' to extract the JSON object
            start_index = analysis_text.find('{')
            end_index = analysis_text.rfind('}')
            if start_index != -1 and end_index != -1:
                json_str = analysis_text[start_index:end_index+1]
                analysis_json = json.loads(json_str)
            else:
                raise ValueError("Could not find a valid JSON object in the AI response.")
        else:
            analysis_json = json.loads(analysis_text)
        
        logger.info(f"Successfully parsed Bedrock analysis for job: {job_data.get('title')}")
        return analysis_json

    except (BotoCoreError, ClientError) as e:
        logger.error(f"AWS Bedrock API call failed: {e}", exc_info=True)
        raise ConnectionError(f"Communication error with AWS Bedrock: {e}")
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing failed for Bedrock response: {e}")
        logger.error(f"Response text that failed parsing: {analysis_text}")
        raise ValueError("Failed to parse the analysis from the AI response.")
    except Exception as e:
        logger.error(f"An unexpected error occurred during Bedrock API call: {e}", exc_info=True)
        raise ConnectionError("An unexpected error occurred while analyzing the job.")

async def generate_proposal(job_data: dict, profile_data: dict, analysis_data: dict, api_config: dict) -> str:
    """
    Generates a cover letter for a job application using the AWS Bedrock API.
    """
    logger.info(f"Starting Bedrock proposal generation for job: {job_data.get('title')}")

    aws_access_key_id = api_config.get("aws_access_key_id")
    aws_secret_access_key = api_config.get("aws_secret_access_key")
    aws_region = api_config.get("aws_region", "us-west-2")

    client_args = {
        "service_name": "bedrock-runtime",
        "region_name": aws_region
    }

    if aws_access_key_id and aws_secret_access_key:
        client_args["aws_access_key_id"] = aws_access_key_id
        client_args["aws_secret_access_key"] = aws_secret_access_key

    try:
        client = boto3.client(**client_args)

        prompt_text = prompts.PROPOSAL_GENERATION_PROMPT.format(
            job_data=json.dumps(job_data, indent=2),
            profile_data=json.dumps(profile_data, indent=2),
            analysis_data=json.dumps(analysis_data, indent=2)
        )

        model_id = "us.amazon.nova-lite-v1:0"
        messages = [{"role": "user", "content": [{"text": prompt_text}]}]

        response = client.converse(
            modelId=model_id,
            messages=messages,
        )
        
        proposal_text = response['output']['message']['content'][0]['text']
        logger.info(f"Successfully generated proposal for job: {job_data.get('title')}")
        
        return proposal_text

    except (BotoCoreError, ClientError) as e:
        logger.error(f"AWS Bedrock API call failed during proposal generation: {e}", exc_info=True)
        raise ConnectionError(f"Communication error with AWS Bedrock during proposal generation: {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred during Bedrock proposal generation: {e}", exc_info=True)
        raise ConnectionError("An unexpected error occurred while generating the proposal.")
