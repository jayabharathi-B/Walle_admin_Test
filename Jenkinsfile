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
      // Use PowerShell to decode base64 into a UTF-8 file (works reliably with multiline secrets)
      bat '''
        if not exist auth mkdir auth
        powershell -Command ^
          "$b64 = $env:STORAGE_STATE_BASE64; ^
           $bytes = [System.Convert]::FromBase64String($b64); ^
           [System.IO.File]::WriteAllBytes('auth\\\\storageState.json', $bytes); ^
           if (Test-Path auth\\\\storageState.json) { Write-Host 'storageState written OK'; } else { Write-Host 'storageState write failed'; exit 1 }"
      '''
    }
  }
}
    stage('Verify storageState') {
      steps {
        bat 'if exist auth\\storageState.json (for %I in (auth\\storageState.json) do @echo size=%~zI) else (echo storageState missing & exit 1)'
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
