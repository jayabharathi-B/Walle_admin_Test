pipeline {
  agent any

  environment {
    NODE_VERSION = '18'
  }

  options {
    timestamps()
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install dependencies') {
      steps {
        bat 'npm install'
        bat 'npx playwright install --with-deps'
      }
    }

    stage('Restore storageState') {
      steps {
        withCredentials([string(credentialsId: 'STORAGE_STATE_BASE64', variable: 'STORAGE_STATE_BASE64')]) {
          bat '''
            if not exist auth mkdir auth
            echo %STORAGE_STATE_BASE64% > auth\\storage64.txt
            certutil -decode auth\\storage64.txt auth\\storageState.json
            dir auth
          '''
        }
      }
    }

    stage('Run Playwright tests') {
      steps {
        bat 'npx playwright test --reporter=html'
      }
    }

    stage('Archive results') {
      steps {
        archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
        archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
      }
    }
  }

  post {
    always {
      echo 'Pipeline finished'
      cleanWs()
    }
  }
}
