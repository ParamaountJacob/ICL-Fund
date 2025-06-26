@@ .. @@
            <h4 className="text-xl font-semibold mb-2">Step 2: Promissory Note</h4>
            <div className="text-gray-500 mb-4">
-              Sign your promissory note and review investment terms.
              Sign your promissory note and review investment terms.
+              Review and sign your promissory note created by our team.
            </div>
            <button 
              onClick={() => navigate(`/onboarding-flow/promissory-note?applicationId=${applicationId}`)}
              className={`px-4 py-2 rounded-md flex items-center justify-center gap-2 ${
                currentStep >= 2
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={currentStep < 2}
            >
              <FileCheck className="w-4 h-4" />
-              Sign Promissory Note
              Sign Promissory Note
+              Review & Sign Promissory Note
            </button>
          </div>
@@ .. @@
            <h4 className="text-xl font-semibold mb-2">Step 3: Fund Your Investment</h4>
            <div className="text-gray-500 mb-4">
-              Complete your wire transfer to fund your investment.
              Complete your wire transfer to fund your investment.
+              Review wire instructions and complete your wire transfer.
            </div>
            <button 
              onClick={() => navigate(`/onboarding-flow/wire-details?applicationId=${applicationId}`)}
              className={`px-4 py-2 rounded-md flex items-center justify-center gap-2 ${
                currentStep >= 3
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={currentStep < 3}
            >
              <Building2 className="w-4 h-4" />
-              Complete Wire Transfer
+              Review Wire Instructions
            </button>
          </div>