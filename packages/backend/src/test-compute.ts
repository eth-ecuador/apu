import { OGComputeService } from "./services/og-compute.service.js";
import { ethers } from "ethers";

async function testCompute() {
  console.log("=== Testing 0G Compute Service ===");
  console.log("");

  const compute = new OGComputeService();

  const testCases = [
    {
      symptoms: "Fever, headache, sore throat",
      medicalHistory: {
        age: 35,
        allergies: [],
        medications: []
      }
    },
    {
      symptoms: "Chest pain, shortness of breath",
      medicalHistory: {
        age: 55,
        allergies: ["penicillin"],
        medications: ["metformin"],
        previousConditions: ["diabetes", "hypertension"]
      }
    },
    {
      symptoms: "Fatigue, weight loss, increased thirst",
      medicalHistory: {
        age: 42,
        allergies: [],
        medications: []
      }
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`Test Case ${i + 1}:`);
    console.log("Symptoms:", testCase.symptoms);
    console.log("Medical History:", JSON.stringify(testCase.medicalHistory, null, 2));
    console.log("");

    const requestId = ethers.hexlify(ethers.randomBytes(16));

    console.log("Running AI inference in TEE...");
    const result = await compute.runDiagnosisInference({
      symptoms: testCase.symptoms,
      medicalHistory: testCase.medicalHistory,
      requestId
    });

    if ("error" in result) {
      console.error("❌ Inference failed:", result.error);
      continue;
    }

    console.log("✅ Inference successful!");
    console.log("Diagnosis:", result.ok.diagnosis);
    console.log("Confidence:", `${(result.ok.confidence * 100).toFixed(1)}%`);
    console.log("TEE Signature:", Buffer.from(result.ok.teeSignature).toString("hex").substring(0, 32) + "...");
    console.log("");
  }

  console.log("=== All compute tests completed! ===");
}

testCompute()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
