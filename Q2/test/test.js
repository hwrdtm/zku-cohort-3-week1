const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const { groth16, plonk } = require("snarkjs");

function unstringifyBigInts(o) {
  if (typeof o == "string" && /^[0-9]+$/.test(o)) {
    return BigInt(o);
  } else if (typeof o == "string" && /^0x[0-9a-fA-F]+$/.test(o)) {
    return BigInt(o);
  } else if (Array.isArray(o)) {
    return o.map(unstringifyBigInts);
  } else if (typeof o == "object") {
    if (o === null) return null;
    const res = {};
    const keys = Object.keys(o);
    keys.forEach((k) => {
      res[k] = unstringifyBigInts(o[k]);
    });
    return res;
  } else {
    return o;
  }
}

describe("HelloWorld", function () {
  let Verifier;
  let verifier;

  beforeEach(async function () {
    Verifier = await ethers.getContractFactory("HelloWorldVerifier");
    verifier = await Verifier.deploy();
    await verifier.deployed();
  });

  it("Should return true for correct proof", async function () {
    //[assignment] Add comments to explain what each line is doing

    // Generate the proof using Groth16, specifying input signals a and b
    // as 1 and 2 respectively, and referencing the corresponding wasm and
    // zkey files. The proof and any public signals are assigned to variables
    // upon destructuring the response object from the async call.
    const { proof, publicSignals } = await groth16.fullProve(
      { a: "1", b: "2" },
      "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm",
      "contracts/circuits/HelloWorld/circuit_final.zkey"
    );

    // Print log, accessing first element in the array publicSignals.
    // In circom, all output signals of the main component are made public.
    // Since the main component in HelloWorld has 1 output signal c, this
    // log is printing the value of c after computation.
    console.log("1x2 =", publicSignals[0]);

    // Since publicSignals is an array, unstringifyBigInts maps through
    // each element of this array and converts it into a BigInt object.
    const editedPublicSignals = unstringifyBigInts(publicSignals);
    // Since proof is an object, map through each value to convert itself
    // or its underlying array elements into BigInt objects.
    const editedProof = unstringifyBigInts(proof);
    // Given the proof and public signals, generate solidity-compatible
    // calldata in preparation for calling the verification methods
    // of the verifier smart contracts.
    const calldata = await groth16.exportSolidityCallData(
      editedProof,
      editedPublicSignals
    );

    // First use the regex expression to remove all instances of ", [, ], and
    // whitespace characters in calldata, turning calldata into a comma
    // separated string of hex values. Then, transform into a new array
    // containing just the hex values using .split(","). Finally, map over
    // each array element to turn into string-form of BigInt objects.
    const argv = calldata
      .replace(/["[\]\s]/g, "")
      .split(",")
      .map((x) => BigInt(x).toString());

    // Mirroring the same exact structure of the calldata array and its
    // elements, extract its values and assign to variables a, b, c and Input
    // and pass as separate function arguments to the verifier smart contract
    // verify proof method.

    // Assign a to be an array containing the 1st and 2nd element of the
    // argv array.
    const a = [argv[0], argv[1]];
    // Assign b to be a 2D array. First index contains 3rd and 4th element
    // of the argv array; second index contains 5th and 6th element of the
    // argv array.
    const b = [
      [argv[2], argv[3]],
      [argv[4], argv[5]],
    ];
    // Assign c to be an array containing the 7th and 8th element of the
    // argv array.
    const c = [argv[6], argv[7]];
    // Assign Input to be the first 8 elements of the argv array.
    const Input = argv.slice(8);

    // Call the verifyProof method on the verifier smart contract with
    // a, b, c and Input as function arguments, and assert the return
    // value to be true.
    expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
  });
  it("Should return false for invalid proof", async function () {
    let a = [0, 0];
    let b = [
      [0, 0],
      [0, 0],
    ];
    let c = [0, 0];
    let d = [0];
    expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
  });
});

describe("Multiplier3 with Groth16", function () {
  let Verifier;
  let verifier;

  beforeEach(async function () {
    //[assignment] insert your script here
    Verifier = await ethers.getContractFactory("Multiplier3Verifier");
    verifier = await Verifier.deploy();
    await verifier.deployed();
  });

  it("Should return true for correct proof", async function () {
    //[assignment] insert your script here
    const { proof, publicSignals } = await groth16.fullProve(
      { a: "1", b: "2", c: "3" },
      "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm",
      "contracts/circuits/Multiplier3/circuit_final.zkey"
    );

    console.log("1x2x3 =", publicSignals[0]);

    const editedPublicSignals = unstringifyBigInts(publicSignals);
    const editedProof = unstringifyBigInts(proof);
    const calldata = await groth16.exportSolidityCallData(
      editedProof,
      editedPublicSignals
    );

    const argv = calldata
      .replace(/["[\]\s]/g, "")
      .split(",")
      .map((x) => BigInt(x).toString());

    const a = [argv[0], argv[1]];
    const b = [
      [argv[2], argv[3]],
      [argv[4], argv[5]],
    ];
    const c = [argv[6], argv[7]];
    const Input = argv.slice(8);

    expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
  });

  it("Should return false for invalid proof", async function () {
    //[assignment] insert your script here
    let a = [0, 0];
    let b = [
      [0, 0],
      [0, 0],
    ];
    let c = [0, 0];
    let d = [0];
    expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
  });
});

describe("Multiplier3 with PLONK", function () {
  let Verifier;
  let verifier;

  beforeEach(async function () {
    //[assignment] insert your script here
    Verifier = await ethers.getContractFactory("Multiplier3Verifier_plonk");
    verifier = await Verifier.deploy();
    await verifier.deployed();
  });

  it("Should return true for correct proof", async function () {
    //[assignment] insert your script here

    const { proof, publicSignals } = await plonk.fullProve(
      { a: "1", b: "2", c: "3" },
      "contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm",
      "contracts/circuits/Multiplier3_plonk/circuit_final.zkey"
    );

    console.log("1x2x3 =", publicSignals[0]);

    const editedPublicSignals = unstringifyBigInts(publicSignals);
    const editedProof = unstringifyBigInts(proof);
    const calldata = await plonk.exportSolidityCallData(
      editedProof,
      editedPublicSignals
    );

    const argv = calldata.replace(/["[\]\s]/g, "").split(",");

    // assert
    expect(await verifier.verifyProof(argv[0], [BigInt(argv[1]).toString()])).to
      .be.true;
  });

  it("Should return false for invalid proof", async function () {
    //[assignment] insert your script here
    expect(await verifier.verifyProof("0x00", ["0"])).to.be.false;
  });
});
