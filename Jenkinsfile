pipeline {
  agent any

  environment {
    NODE_VERSION = '18'
  }

  options { timestamps() }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Setup Node') {
      steps {
        sh '''
          # ensure node is available on agent; if not, install or use node tool
          # on many Jenkins agents Node is preinstalled. Adjust as needed.
          node -v || (curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs)
        '''
      }
    }

    stage('Install dependencies') {
      steps {
        sh 'npm ci'
        sh 'npm run install:playwright' // defined in package.json
      }
    }

    stage('Restore storageState') {
      steps {
        // Use Jenkins credentials to decode and write storageState.json
        withCredentials([string(credentialsId: 'STORAGE_STATE_BASE64', variable: 'STORAGE_STATE_BASE64')]) {
          sh '''
            mkdir -p auth
            echo "$STORAGE_STATE_BASE64" | base64 --decode > auth/storageState.json
            ls -l auth
          '''
        }
      }
    }

    stage('Run Playwright tests') {
      steps {
        // Set CI env var so tests know they're running in CI if needed
        sh 'CI=true npx playwright test --reporter=html --output=test-results || true'
      }
    }

    stage('Archive results') {
      steps {
        archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
        archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
        archiveArtifacts artifacts: 'tmp/**', allowEmptyArchive: true
      }
    }
  }

  post {
    always {
      echo 'Pipeline finished — check artifacts'
      cleanWs()
    }
  }
}
