// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title Pela — on-chain pet identity & care log
/// @notice Admin manages roles + pause. Viewers (owners) register pets and assign editors.
///         Editors (vets/trainers) write care logs for pets assigned to them.
/// @dev Everything stored here is public. Keep personal data off-chain.
contract Pela is AccessControl, Pausable {
    bytes32 public constant EDITOR_ROLE = keccak256("EDITOR_ROLE");
    bytes32 public constant VIEWER_ROLE = keccak256("VIEWER_ROLE");

    uint256 public constant MAX_NAME = 64;
    uint256 public constant MAX_NOTE = 280;

    enum CareKind { Vaccination, Meal, Training, Checkup, Grooming, Other }

    struct Pet {
        address owner;
        string name;
        string breed;
        uint64 birthDate; // unix seconds, 0 = unknown
        uint64 createdAt;
        bool active;
    }

    struct CareLog {
        uint256 petId;
        address editor;
        CareKind kind;
        string note;
        uint64 timestamp;
        uint64 updatedAt;
        bool active;
    }

    uint256 public petCount;
    uint256 public logCount;

    mapping(uint256 => Pet) private _pets; // ids start at 1
    mapping(uint256 => CareLog) private _logs; // ids start at 1
    mapping(address => uint256[]) private _ownerPets;
    mapping(uint256 => uint256[]) private _petLogs;
    mapping(uint256 => mapping(address => bool)) public isAssigned; // petId => editor => bool

    event PetRegistered(uint256 indexed petId, address indexed owner, string name);
    event PetUpdated(uint256 indexed petId);
    event PetDeactivated(uint256 indexed petId);
    event EditorAssigned(uint256 indexed petId, address indexed editor, bool assigned);
    event CareLogAdded(uint256 indexed logId, uint256 indexed petId, address indexed editor, CareKind kind);
    event CareLogUpdated(uint256 indexed logId);
    event CareLogDeleted(uint256 indexed logId);

    error PetNotFound(uint256 petId);
    error PetInactive(uint256 petId);
    error LogNotFound(uint256 logId);
    error NotPetOwnerOrAdmin();
    error NotAssignedEditor();
    error NotLogAuthorOrAdmin();
    error NotAnEditor(address account);
    error InvalidLength();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ---------- modifiers ----------

    modifier petExists(uint256 petId) {
        if (petId == 0 || petId > petCount) revert PetNotFound(petId);
        _;
    }

    modifier petActive(uint256 petId) {
        if (petId == 0 || petId > petCount) revert PetNotFound(petId);
        if (!_pets[petId].active) revert PetInactive(petId);
        _;
    }

    modifier onlyPetOwnerOrAdmin(uint256 petId) {
        if (_pets[petId].owner != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert NotPetOwnerOrAdmin();
        }
        _;
    }

    // ---------- admin: global settings ----------

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    // ---------- Pet CRUD ----------

    function registerPet(string calldata name, string calldata breed, uint64 birthDate)
        external
        whenNotPaused
        onlyRole(VIEWER_ROLE)
        returns (uint256 petId)
    {
        _checkLen(name, MAX_NAME, true);
        _checkLen(breed, MAX_NAME, false);
        petId = ++petCount;
        _pets[petId] = Pet(msg.sender, name, breed, birthDate, uint64(block.timestamp), true);
        _ownerPets[msg.sender].push(petId);
        emit PetRegistered(petId, msg.sender, name);
    }

    function updatePet(uint256 petId, string calldata name, string calldata breed, uint64 birthDate)
        external
        whenNotPaused
        petActive(petId)
        onlyPetOwnerOrAdmin(petId)
    {
        _checkLen(name, MAX_NAME, true);
        _checkLen(breed, MAX_NAME, false);
        Pet storage p = _pets[petId];
        p.name = name;
        p.breed = breed;
        p.birthDate = birthDate;
        emit PetUpdated(petId);
    }

    /// @notice Soft delete. History (care logs) stays readable for provenance.
    function deactivatePet(uint256 petId)
        external
        whenNotPaused
        petActive(petId)
        onlyPetOwnerOrAdmin(petId)
    {
        _pets[petId].active = false;
        emit PetDeactivated(petId);
    }

    function setEditor(uint256 petId, address editor, bool assigned)
        external
        whenNotPaused
        petActive(petId)
        onlyPetOwnerOrAdmin(petId)
    {
        if (assigned && !hasRole(EDITOR_ROLE, editor)) revert NotAnEditor(editor);
        isAssigned[petId][editor] = assigned;
        emit EditorAssigned(petId, editor, assigned);
    }

    // ---------- CareLog CRUD ----------

    function addCareLog(uint256 petId, CareKind kind, string calldata note)
        external
        whenNotPaused
        onlyRole(EDITOR_ROLE)
        petActive(petId)
        returns (uint256 logId)
    {
        if (!isAssigned[petId][msg.sender]) revert NotAssignedEditor();
        _checkLen(note, MAX_NOTE, true);
        logId = ++logCount;
        _logs[logId] = CareLog(petId, msg.sender, kind, note, uint64(block.timestamp), 0, true);
        _petLogs[petId].push(logId);
        emit CareLogAdded(logId, petId, msg.sender, kind);
    }

    function updateCareLog(uint256 logId, CareKind kind, string calldata note) external whenNotPaused {
        CareLog storage l = _activeLog(logId);
        _requireLogAuthority(l);
        _checkLen(note, MAX_NOTE, true);
        l.kind = kind;
        l.note = note;
        l.updatedAt = uint64(block.timestamp);
        emit CareLogUpdated(logId);
    }

    function deleteCareLog(uint256 logId) external whenNotPaused {
        CareLog storage l = _activeLog(logId);
        _requireLogAuthority(l);
        l.active = false;
        emit CareLogDeleted(logId);
    }

    // ---------- reads ----------

    function getPet(uint256 petId) external view petExists(petId) returns (Pet memory) {
        return _pets[petId];
    }

    function getCareLog(uint256 logId) external view returns (CareLog memory) {
        if (logId == 0 || logId > logCount) revert LogNotFound(logId);
        return _logs[logId];
    }

    function getPetsByOwner(address owner) external view returns (uint256[] memory) {
        return _ownerPets[owner];
    }

    /// @dev Includes deleted logs; filter on `active` client-side.
    function getPetLogIds(uint256 petId) external view petExists(petId) returns (uint256[] memory) {
        return _petLogs[petId];
    }

    // ---------- internals ----------

    function _activeLog(uint256 logId) private view returns (CareLog storage l) {
        if (logId == 0 || logId > logCount) revert LogNotFound(logId);
        l = _logs[logId];
        if (!l.active) revert LogNotFound(logId);
    }

    /// Admin always; otherwise the original author, who must still be an editor assigned to the pet.
    function _requireLogAuthority(CareLog storage l) private view {
        if (hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) return;
        if (
            l.editor != msg.sender ||
            !hasRole(EDITOR_ROLE, msg.sender) ||
            !isAssigned[l.petId][msg.sender]
        ) revert NotLogAuthorOrAdmin();
    }

    function _checkLen(string calldata s, uint256 max, bool required) private pure {
        uint256 len = bytes(s).length;
        if (len > max || (required && len == 0)) revert InvalidLength();
    }
}
