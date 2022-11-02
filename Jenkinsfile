pipeline {
    agent any

    options {
        ansiColor('xterm')
    }

    environment {
        AWS_CRED = "casstest"
        WORKDIR = "./"
        AWS_REGION = "ap-southeast-2"
        AWS_ACCOUNTID = "327746137438"
        IMAGE_NAME = "prac"
        //IMAGE_TAG =  "${GIT_COMMIT_MSG}" 
        //IMAGE_TAG = "latest"
        IMAGE_TAG = "${GIT_COMMIT[0..6]}"
        ECR_REPO_NAME = "ecsprac"
        ECR_PREFIX_URL = "${AWS_ACCOUNTID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        IMAGE_URI = "${AWS_ACCOUNTID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${IMAGE_TAG}"
        TASK_DEFINITION = "ecsprac-td"
        //taskDefinitionArn = "arn:aws:ecs:ap-southeast-2:327746137438:task-definition/ecsprac-td" //aws ecs describe-task-definition --task-definition ecsprac-td
        ECS_CLUSTER = "ecsprac-cluster"
        ECS_SERVICE = "ecsprac-service"
        DESIRED_COUNT = 2

        MONGO_URI = credentials('junglemeet-mongo-uri')
        TMDB_KEY = credentials('junglemeet-tmdb-key')
    }

    stages {
        /*stage("GitCommitExtract"){
            steps {
                script{
                    //env.GIT_COMMIT_MSG = sh (script: 'git rev-parse --short HEAD', returnStdout: true).trim()

                    env.GIT_COMMIT_MSG = sh (script: 'git rev-parse --short HEAD | cut -c 1-5', returnStdout: true).trim()
                }
            }
        }*/

        stage("LoginECR"){
            steps {
                withAWS(credentials: 'casstest', region: 'ap-southeast-2'){
                    sh "aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin ${ECR_PREFIX_URL}"
                }
            }
        }

        stage("BuildImage"){
            steps {
                dir(WORKDIR){
                    sh ('docker build --build-arg MONGOURI_ARG=\"$MONGO_URI\" \
                        --build-arg TMDB_ARG=$TMDB_KEY \
                        -t $IMAGE_NAME:$IMAGE_TAG .')
                }
            }
        }

        stage("ScanImage"){
            steps {
                dir(WORKDIR){
                    sh "trivy --severity HIGH,CRITICAL image ${IMAGE_NAME}:${IMAGE_TAG}"
                }
            }
        }

        stage("TagImage"){
            steps {
                dir(WORKDIR){
                    sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_URI}"
                }
            }
        }

        stage("PushImage"){
            steps {
                dir(WORKDIR){
                    withAWS(credentials: 'casstest', region: 'ap-southeast-2'){
                        sh "docker push ${IMAGE_URI}"
                    }
                }
            }
        }

        stage("Update"){
            steps{
                dir(WORKDIR){
                    withAWS(credentials: 'casstest', region: 'ap-southeast-2'){
                        script{
                            //sh "sed -i 's/\"image\":[^,]*/\"image\":\"${IMAGE_URI}\"/' taskdef.json"
                            //sh "sed -n '/REPLACE/p' taskdef.json | sed 's/REPLACE/${IMAGE_URI}/g'"
                            sh "sed -i 's#REPLACE#${IMAGE_URI}#' taskdef.json"

                            sh "aws ecs register-task-definition --family ${TASK_DEFINITION} \
                                    --cli-input-json file://taskdef.json \
                                    --requires-compatibilities 'FARGATE' \
                                    --region ${AWS_REGION}"

                            env.REVISION = sh(script: "aws ecs describe-task-definition --task-definition ${TASK_DEFINITION} | jq .taskDefinition.revision", returnStdout: true).trim()

                            sh "aws ecs update-service --cluster ${ECS_CLUSTER} \
                                    --region ${AWS_REGION} \
                                    --service ${ECS_SERVICE} \
                                    --task-definition ${TASK_DEFINITION}:${REVISION} \
                                    --desired-count ${DESIRED_COUNT}" 
                        }
                    }
                }
            }
        }

        stage("clean"){
            steps{
                dir(WORKDIR){
                    sh "docker rmi ${IMAGE_NAME}:${IMAGE_TAG}"
                    sh "docker container prune -f"
                }
            }
        }
    }





    post {
        always{
            cleanWs()
        }

        /*success{
            emailext body: '$DEFAULT_CONTENT', subject: '$DEFAULT_SUBJECT', to: '$DEFAULT_RECIPIENTS'
        }

        failure{
            emailext body: '$DEFAULT_CONTENT', subject: '$DEFAULT_SUBJECT', to: '$DEFAULT_RECIPIENTS'
        }*/
    
    }
}