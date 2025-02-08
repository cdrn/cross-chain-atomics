import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AtomicSwap } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AtomicSwap", function () {
  async function deployAtomicSwapFixture() {
    const [taker, maker] = await ethers.getSigners();

    const AtomicSwap = await ethers.getContractFactory("AtomicSwap");
    const atomicSwap = await AtomicSwap.deploy();
    await atomicSwap.waitForDeployment();

    // Generate a random secret and its hash
    const secret = ethers.randomBytes(32);
    const hashlock = ethers.keccak256(secret);

    // Set timelock 1 hour in the future
    const timelock = Math.floor(Date.now() / 1000) + 3600;

    // Test values
    const value = ethers.parseEther("1.0");
    const premium = ethers.parseEther("0.1");

    return {
      atomicSwap,
      taker,
      maker,
      secret,
      hashlock,
      timelock,
      value,
      premium,
    };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { atomicSwap } = await loadFixture(deployAtomicSwapFixture);
      expect(await atomicSwap.getAddress()).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe("Creating Swaps", function () {
    it("Should create a swap successfully", async function () {
      const { atomicSwap, maker, taker, hashlock, timelock, value, premium } =
        await loadFixture(deployAtomicSwapFixture);

      const tx = await atomicSwap.createSwap(
        maker.address,
        hashlock,
        timelock,
        premium,
        {
          value: value,
        }
      );

      const receipt = await tx.wait();
      expect(receipt?.logs.length).to.equal(1);

      const event = receipt?.logs[0];
      expect(event?.topics[0]).to.equal(
        ethers.id(
          "SwapCreated(bytes32,address,address,uint256,uint256,bytes32,uint256)"
        )
      );

      // Get the taker's address from the event
      const takerTopic = event?.topics[2];
      const decodedTaker = ethers.AbiCoder.defaultAbiCoder().decode(
        ["address"],
        ethers.zeroPadValue(takerTopic || "0x", 32)
      )[0];

      expect(decodedTaker.toLowerCase()).to.equal(taker.address.toLowerCase());
    });

    it("Should fail if value is less than premium", async function () {
      const { atomicSwap, maker, hashlock, timelock, premium } =
        await loadFixture(deployAtomicSwapFixture);

      const lowValue = premium / 2n;

      await expect(
        atomicSwap.createSwap(maker.address, hashlock, timelock, premium, {
          value: lowValue,
        })
      ).to.be.revertedWith("Value must exceed premium");
    });

    it("Should fail if timelock is in the past", async function () {
      const { atomicSwap, maker, hashlock, value, premium } = await loadFixture(
        deployAtomicSwapFixture
      );

      const pastTimelock = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      await expect(
        atomicSwap.createSwap(maker.address, hashlock, pastTimelock, premium, {
          value: value,
        })
      ).to.be.revertedWith("Timelock must be in future");
    });
  });

  describe("Claiming Swaps", function () {
    it("Should allow maker to claim with correct secret", async function () {
      const { atomicSwap, maker, secret, hashlock, timelock, value, premium } =
        await loadFixture(deployAtomicSwapFixture);

      // Create swap
      const tx = await atomicSwap.createSwap(
        maker.address,
        hashlock,
        timelock,
        premium,
        {
          value: value,
        }
      );
      const receipt = await tx.wait();
      const swapId = receipt?.logs[0].topics[1] as string;

      // Claim as maker
      await expect(atomicSwap.connect(maker).claim(swapId, secret))
        .to.emit(atomicSwap, "SwapClaimed")
        .withArgs(swapId, secret);
    });

    it("Should fail if secret is incorrect", async function () {
      const { atomicSwap, maker, hashlock, timelock, value, premium } =
        await loadFixture(deployAtomicSwapFixture);

      // Create swap
      const tx = await atomicSwap.createSwap(
        maker.address,
        hashlock,
        timelock,
        premium,
        {
          value: value,
        }
      );
      const receipt = await tx.wait();
      const swapId = receipt?.logs[0].topics[1] as string;

      // Try to claim with wrong secret
      const wrongSecret = ethers.randomBytes(32);
      await expect(
        atomicSwap.connect(maker).claim(swapId, wrongSecret)
      ).to.be.revertedWith("Invalid secret");
    });
  });

  describe("Refunding Swaps", function () {
    it("Should allow taker to refund after timelock expires", async function () {
      const { atomicSwap, taker, maker, hashlock, value, premium } =
        await loadFixture(deployAtomicSwapFixture);

      // Get current block timestamp
      const latestBlock = await ethers.provider.getBlock("latest");
      const currentTimestamp = latestBlock!.timestamp;

      // Create swap with timelock 5 seconds in the future
      const shortTimelock = currentTimestamp + 5;
      const tx = await atomicSwap.createSwap(
        maker.address,
        hashlock,
        shortTimelock,
        premium,
        {
          value: value,
        }
      );
      const receipt = await tx.wait();
      const swapId = receipt?.logs[0].topics[1] as string;

      // Wait for timelock to expire (advance time by 6 seconds)
      await ethers.provider.send("evm_increaseTime", [6]);
      await ethers.provider.send("evm_mine", []);

      // Refund
      await expect(atomicSwap.connect(taker).refund(swapId))
        .to.emit(atomicSwap, "SwapRefunded")
        .withArgs(swapId);
    });

    it("Should fail to refund before timelock expires", async function () {
      const { atomicSwap, taker, maker, hashlock, timelock, value, premium } =
        await loadFixture(deployAtomicSwapFixture);

      // Create swap
      const tx = await atomicSwap.createSwap(
        maker.address,
        hashlock,
        timelock,
        premium,
        {
          value: value,
        }
      );
      const receipt = await tx.wait();
      const swapId = receipt?.logs[0].topics[1] as string;

      // Try to refund immediately
      await expect(atomicSwap.connect(taker).refund(swapId)).to.be.revertedWith(
        "Swap not expired"
      );
    });
  });
});
