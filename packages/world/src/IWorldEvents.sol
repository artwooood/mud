// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { IWorldErrors } from "./IWorldErrors.sol";
import { IModule } from "./IModule.sol";
import { ResourceId } from "./WorldResourceId.sol";

/**
 * @title IWorldEvents
 * @author MUD (https://mud.dev) by Lattice (https://lattice.xyz)
 * @dev We bundle these events in an interface (instead of at the file-level or in their corresponding library) so they can be inherited by IWorldKernel.
 * This ensures that all events are included in the IWorldKernel ABI for proper decoding in the frontend.
 */
interface IWorldEvents {
  /**
   * @dev Emitted upon successful World initialization.
   * @param worldVersion The version of the World being initialized.
   */
  event HelloWorld(bytes32 indexed worldVersion);
}
