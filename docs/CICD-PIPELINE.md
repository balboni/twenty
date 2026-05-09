# CI/CD Pipeline — Twenty CRM (balboni/twenty)

## Overview

Every push to `main` automatically builds a Docker image, pushes it to ECR, and deploys it to the production EC2 instance. End-to-end time: ~17 minutes.

## Pipeline Flow

```
Push to main
    |
GitHub Actions (build-and-push) ~14 min
    -> Checks out repo
    -> Authenticates to AWS ECR
    -> Builds Docker image (twenty-aws target: server + frontend + aws-cli)
    -> Pushes to ECR with :latest and :sha tags
    |
GitHub Actions (deploy) ~3 min
    -> Authenticates to AWS
    -> Sends SSM command to EC2 instance
    -> EC2 pulls new image from ECR
    -> Restarts containers via docker-compose
    -> Health check confirms server is up
```

## Infrastructure

| Component | Detail |
|-----------|--------|
| GitHub Repo | `balboni/twenty` (fork of twentyhq/twenty) |
| Workflow File | `.github/workflows/deploy-ecr.yml` |
| AWS Account | 983142347498 (us-east-2) |
| ECR Repo | `983142347498.dkr.ecr.us-east-2.amazonaws.com/twenty-crm` |
| EC2 Instance | `twenty-crm-prod` (t3.medium, i-0ca5fa3f9bd8dde0e) |
| Public IP | 3.151.91.15 |
| URL | https://crm.close-rate.com |
| Deploy Method | AWS Systems Manager (SSM) -- no SSH port exposure needed |

## Docker Compose (on EC2)

Location: `/home/ec2-user/twenty/docker-compose.yml`

| Container | Image | Purpose |
|-----------|-------|---------|
| twenty-server-1 | ECR twenty-crm:latest | Server + frontend (port 3000) |
| twenty-worker-1 | ECR twenty-crm:latest | Background job worker |
| twenty-db-1 | postgres:16 | Database (Docker volume `db-data`) |
| twenty-redis-1 | redis | Cache + sessions |

File storage: S3 bucket `close-rate-twenty-files` (us-east-2)

## GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `AWS_ACCESS_KEY_ID` | IAM user `github-actions-twenty` -- ECR push + SSM commands |
| `AWS_SECRET_ACCESS_KEY` | Corresponding secret key |
| `EC2_SSH_KEY` | Legacy SSH key (used before SSM switch -- can be removed) |

## IAM Setup

| Resource | Permissions |
|----------|-------------|
| IAM user `github-actions-twenty` | `twenty-ecr-push` (push images to ECR), `twenty-ssm-deploy` (send SSM commands + get invocation results) |
| EC2 role `TwentyBackupEC2Role` | `twenty-ecr-pull` (pull images from ECR), `AmazonSSMManagedInstanceCore` (SSM agent registration) |

## Manual Deploy

SSH into the instance and run:

```bash
ssh -i ~/.ssh/twenty-rsa.pem ec2-user@3.151.91.15

aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 983142347498.dkr.ecr.us-east-2.amazonaws.com
cd ~/twenty && docker-compose pull && docker-compose up -d
```

## Running Workspace Commands

```bash
ssh -i ~/.ssh/twenty-rsa.pem ec2-user@3.151.91.15

docker exec twenty-server-1 node dist/command/command <command-name> \
  --workspace-id 504d90bc-d1ba-4692-a027-e72c5fb31e3f
```

## AWS CLI Access

Profile `brian-admin` (IAM user with MFA, us-east-2):

```bash
aws login --profile brian-admin
aws sts get-caller-identity --profile brian-admin
```
