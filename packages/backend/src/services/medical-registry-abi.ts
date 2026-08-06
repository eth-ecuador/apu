/**
 * MedicalDataRegistry Contract ABI
 * Generated from deployed contract at 0x2819Cf40a952748014C56f393e1ffd16f4a377ff
 */
export const MEDICAL_REGISTRY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "handle",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "SenderNotAllowedToUseHandle",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZamaProtocolUnsupported",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "patient",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "doctor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "teeSignatureHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint40",
        "name": "timestamp",
        "type": "uint40"
      }
    ],
    "name": "DiagnosisStored",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "doctor",
        "type": "address"
      }
    ],
    "name": "DoctorAuthorized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "doctor",
        "type": "address"
      }
    ],
    "name": "DoctorRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "patient",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "ogStorageRoot",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint40",
        "name": "timestamp",
        "type": "uint40"
      }
    ],
    "name": "PatientDataSubmitted",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "anchoredRoots",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "doctor",
        "type": "address"
      }
    ],
    "name": "authorizeDoctor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authorizedDoctors",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "confidentialProtocolId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "patient",
        "type": "address"
      }
    ],
    "name": "getPatientRecord",
    "outputs": [
      {
        "components": [
          {
            "internalType": "euint32",
            "name": "encryptedRiskScore",
            "type": "bytes32"
          },
          {
            "internalType": "euint32",
            "name": "encryptedDiagnosis",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "ogStorageRoot",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "teeSignature",
            "type": "bytes"
          },
          {
            "internalType": "uint40",
            "name": "submittedAt",
            "type": "uint40"
          },
          {
            "internalType": "uint40",
            "name": "diagnosedAt",
            "type": "uint40"
          },
          {
            "internalType": "bool",
            "name": "hasData",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "diagnosed",
            "type": "bool"
          }
        ],
        "internalType": "struct MedicalDataRegistry.PatientRecord",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "storageRoot",
        "type": "bytes32"
      }
    ],
    "name": "isRootAnchored",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "patients",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "encryptedRiskScore",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "encryptedDiagnosis",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "ogStorageRoot",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "teeSignature",
        "type": "bytes"
      },
      {
        "internalType": "uint40",
        "name": "submittedAt",
        "type": "uint40"
      },
      {
        "internalType": "uint40",
        "name": "diagnosedAt",
        "type": "uint40"
      },
      {
        "internalType": "bool",
        "name": "hasData",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "diagnosed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "doctor",
        "type": "address"
      }
    ],
    "name": "revokeDoctor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "patient",
        "type": "address"
      },
      {
        "internalType": "externalEuint32",
        "name": "encryptedDiagnosis",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "proof",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "teeSignature",
        "type": "bytes"
      }
    ],
    "name": "storeDiagnosis",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "encryptedRiskScore",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "proof",
        "type": "bytes"
      },
      {
        "internalType": "bytes32",
        "name": "ogStorageRoot",
        "type": "bytes32"
      }
    ],
    "name": "submitPatientData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalDiagnoses",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalPatients",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "patient",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "newStorageRoot",
        "type": "bytes32"
      }
    ],
    "name": "updateStorageRoot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
