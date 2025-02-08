// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title AtomicSwap
 * @dev Implements atomic swap functionality between ETH and BTC
 * The contract handles the ETH side of the swap, with timelock and hashlock mechanisms
 */
contract AtomicSwap is ReentrancyGuard {
    using Address for address payable;

    struct Swap {
        address payable taker; // Who is buying BTC (sending ETH)
        address payable maker; // Who is selling BTC (receiving ETH)
        uint256 value; // Amount of ETH locked (including premium)
        uint256 premium; // Premium amount in ETH
        bytes32 hashlock; // Hash of the secret
        uint256 timelock; // Timestamp when swap expires
        bool claimed; // Whether the swap was claimed
        bool refunded; // Whether the swap was refunded
    }

    // Mapping from swap ID to Swap struct
    mapping(bytes32 => Swap) public swaps;

    // Events
    event SwapCreated(
        bytes32 indexed swapId,
        address indexed taker,
        address indexed maker,
        uint256 value,
        uint256 premium,
        bytes32 hashlock,
        uint256 timelock
    );

    event SwapClaimed(bytes32 indexed swapId, bytes32 secret);
    event SwapRefunded(bytes32 indexed swapId);

    /**
     * @dev Creates a new swap
     * @param maker Address of the maker (BTC seller)
     * @param hashlock Hash of the secret
     * @param timelock Timestamp when the swap expires
     * @param premium Premium amount in ETH
     */
    function createSwap(
        address payable maker,
        bytes32 hashlock,
        uint256 timelock,
        uint256 premium
    ) external payable nonReentrant returns (bytes32 swapId) {
        require(msg.value > premium, "Value must exceed premium");
        require(timelock > block.timestamp, "Timelock must be in future");
        require(maker != address(0), "Invalid maker address");
        require(premium > 0, "Premium must be greater than 0");

        // Calculate swap ID
        swapId = keccak256(
            abi.encodePacked(
                msg.sender,
                maker,
                msg.value,
                hashlock,
                timelock,
                block.chainid
            )
        );

        require(swaps[swapId].timelock == 0, "Swap already exists");

        // Create the swap
        swaps[swapId] = Swap({
            taker: payable(msg.sender),
            maker: maker,
            value: msg.value,
            premium: premium,
            hashlock: hashlock,
            timelock: timelock,
            claimed: false,
            refunded: false
        });

        emit SwapCreated(
            swapId,
            msg.sender,
            maker,
            msg.value,
            premium,
            hashlock,
            timelock
        );

        return swapId;
    }

    /**
     * @dev Claims the swap by revealing the secret
     * @param swapId The ID of the swap
     * @param secret The secret that hashes to the hashlock
     */
    function claim(bytes32 swapId, bytes32 secret) external nonReentrant {
        Swap storage swap = swaps[swapId];
        require(swap.timelock != 0, "Swap does not exist");
        require(!swap.claimed, "Swap already claimed");
        require(!swap.refunded, "Swap already refunded");
        require(block.timestamp < swap.timelock, "Swap expired");
        require(
            keccak256(abi.encodePacked(secret)) == swap.hashlock,
            "Invalid secret"
        );
        require(msg.sender == swap.maker, "Only maker can claim");

        swap.claimed = true;
        emit SwapClaimed(swapId, secret);

        // Transfer ETH to maker
        swap.maker.sendValue(swap.value);
    }

    /**
     * @dev Refunds the swap after timelock expiry
     * @param swapId The ID of the swap
     */
    function refund(bytes32 swapId) external nonReentrant {
        Swap storage swap = swaps[swapId];
        require(swap.timelock != 0, "Swap does not exist");
        require(!swap.claimed, "Swap already claimed");
        require(!swap.refunded, "Swap already refunded");
        require(block.timestamp >= swap.timelock, "Swap not expired");
        require(msg.sender == swap.taker, "Only taker can refund");

        swap.refunded = true;
        emit SwapRefunded(swapId);

        // Return ETH to taker
        swap.taker.sendValue(swap.value);
    }

    /**
     * @dev Gets the details of a swap
     * @param swapId The ID of the swap
     */
    function getSwap(
        bytes32 swapId
    )
        external
        view
        returns (
            address taker,
            address maker,
            uint256 value,
            uint256 premium,
            bytes32 hashlock,
            uint256 timelock,
            bool claimed,
            bool refunded
        )
    {
        Swap storage swap = swaps[swapId];
        require(swap.timelock != 0, "Swap does not exist");

        return (
            swap.taker,
            swap.maker,
            swap.value,
            swap.premium,
            swap.hashlock,
            swap.timelock,
            swap.claimed,
            swap.refunded
        );
    }
}
