const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const Kind = { Vaccination: 0, Meal: 1, Training: 2 };

async function deployFixture() {
  const [admin, vet, owner, stranger, otherVet] = await ethers.getSigners();
  const pela = await ethers.deployContract("Pela", [admin.address]);
  const EDITOR = await pela.EDITOR_ROLE();
  const VIEWER = await pela.VIEWER_ROLE();
  await pela.grantRole(EDITOR, vet.address);
  await pela.grantRole(EDITOR, otherVet.address);
  await pela.grantRole(VIEWER, owner.address);
  return { pela, admin, vet, owner, stranger, otherVet, EDITOR, VIEWER };
}

async function withPechi() {
  const ctx = await deployFixture();
  await ctx.pela.connect(ctx.owner).registerPet("Pechi", "Belgian Malinois", 0);
  await ctx.pela.connect(ctx.owner).setEditor(1, ctx.vet.address, true);
  await ctx.pela.connect(ctx.vet).addCareLog(1, Kind.Vaccination, "Rabies shot");
  return ctx;
}

describe("Pela", () => {
  describe("Pet CRUD", () => {
    it("viewer registers, reads, updates and deactivates a pet", async () => {
      const { pela, owner } = await loadFixture(deployFixture);
      await expect(pela.connect(owner).registerPet("Bella", "Mixed", 0))
        .to.emit(pela, "PetRegistered").withArgs(1, owner.address, "Bella");

      expect((await pela.getPet(1)).name).to.equal("Bella");
      expect(await pela.getPetsByOwner(owner.address)).to.deep.equal([1n]);

      await pela.connect(owner).updatePet(1, "Bella Bean", "Mixed", 1700000000);
      const pet = await pela.getPet(1);
      expect(pet.name).to.equal("Bella Bean");
      expect(pet.birthDate).to.equal(1700000000n);

      await expect(pela.connect(owner).deactivatePet(1)).to.emit(pela, "PetDeactivated");
      expect((await pela.getPet(1)).active).to.equal(false);
      await expect(pela.connect(owner).updatePet(1, "x", "", 0))
        .to.be.revertedWithCustomError(pela, "PetInactive");
    });

    it("validates input lengths and unknown ids", async () => {
      const { pela, owner } = await loadFixture(deployFixture);
      await expect(pela.connect(owner).registerPet("", "Mixed", 0))
        .to.be.revertedWithCustomError(pela, "InvalidLength");
      await expect(pela.connect(owner).registerPet("a".repeat(65), "", 0))
        .to.be.revertedWithCustomError(pela, "InvalidLength");
      await expect(pela.getPet(99)).to.be.revertedWithCustomError(pela, "PetNotFound");
    });
  });

  describe("CareLog CRUD", () => {
    it("assigned editor adds, updates and deletes a log", async () => {
      const { pela, vet } = await loadFixture(withPechi);
      expect((await pela.getCareLog(1)).note).to.equal("Rabies shot");

      await pela.connect(vet).updateCareLog(1, Kind.Training, "Heel drill done");
      const log = await pela.getCareLog(1);
      expect(log.note).to.equal("Heel drill done");
      expect(log.kind).to.equal(Kind.Training);
      expect(log.updatedAt).to.be.greaterThan(0n);

      await pela.connect(vet).deleteCareLog(1);
      expect((await pela.getCareLog(1)).active).to.equal(false);
      await expect(pela.connect(vet).updateCareLog(1, 0, "again"))
        .to.be.revertedWithCustomError(pela, "LogNotFound");
      expect(await pela.getPetLogIds(1)).to.deep.equal([1n]);
    });
  });

  describe("Role-based access control", () => {
    it("only VIEWER can register pets", async () => {
      const { pela, stranger, VIEWER } = await loadFixture(deployFixture);
      await expect(pela.connect(stranger).registerPet("Nope", "", 0))
        .to.be.revertedWithCustomError(pela, "AccessControlUnauthorizedAccount")
        .withArgs(stranger.address, VIEWER);
    });

    it("only owner or admin can update/deactivate a pet or assign editors", async () => {
      const { pela, admin, vet, stranger } = await loadFixture(withPechi);
      await expect(pela.connect(stranger).updatePet(1, "Hacked", "", 0))
        .to.be.revertedWithCustomError(pela, "NotPetOwnerOrAdmin");
      await expect(pela.connect(vet).deactivatePet(1))
        .to.be.revertedWithCustomError(pela, "NotPetOwnerOrAdmin");
      await expect(pela.connect(stranger).setEditor(1, stranger.address, true))
        .to.be.revertedWithCustomError(pela, "NotPetOwnerOrAdmin");
      await expect(pela.connect(admin).updatePet(1, "Pechi", "Malinois", 0)).to.emit(pela, "PetUpdated");
    });

    it("cannot assign an account without EDITOR_ROLE", async () => {
      const { pela, owner, stranger } = await loadFixture(withPechi);
      await expect(pela.connect(owner).setEditor(1, stranger.address, true))
        .to.be.revertedWithCustomError(pela, "NotAnEditor");
    });

    it("editor must be assigned to the pet to log care", async () => {
      const { pela, otherVet, owner, stranger, EDITOR } = await loadFixture(withPechi);
      await expect(pela.connect(otherVet).addCareLog(1, Kind.Meal, "Kibble"))
        .to.be.revertedWithCustomError(pela, "NotAssignedEditor");
      await expect(pela.connect(owner).addCareLog(1, Kind.Meal, "Kibble"))
        .to.be.revertedWithCustomError(pela, "AccessControlUnauthorizedAccount")
        .withArgs(owner.address, EDITOR);
      await expect(pela.connect(stranger).addCareLog(1, Kind.Meal, "Kibble"))
        .to.be.revertedWithCustomError(pela, "AccessControlUnauthorizedAccount");
    });

    it("only the author editor or admin can edit/delete a log", async () => {
      const { pela, admin, owner, otherVet } = await loadFixture(withPechi);
      await pela.connect(owner).setEditor(1, otherVet.address, true);
      await expect(pela.connect(otherVet).updateCareLog(1, 0, "Not mine"))
        .to.be.revertedWithCustomError(pela, "NotLogAuthorOrAdmin");
      await expect(pela.connect(owner).deleteCareLog(1))
        .to.be.revertedWithCustomError(pela, "NotLogAuthorOrAdmin");
      await expect(pela.connect(admin).deleteCareLog(1)).to.emit(pela, "CareLogDeleted");
    });

    it("unassigned or revoked editors lose write access to their old logs", async () => {
      const { pela, admin, vet, owner, EDITOR } = await loadFixture(withPechi);
      await pela.connect(owner).setEditor(1, vet.address, false);
      await expect(pela.connect(vet).updateCareLog(1, 0, "x"))
        .to.be.revertedWithCustomError(pela, "NotLogAuthorOrAdmin");

      await pela.connect(owner).setEditor(1, vet.address, true);
      await pela.connect(admin).revokeRole(EDITOR, vet.address);
      await expect(pela.connect(vet).deleteCareLog(1))
        .to.be.revertedWithCustomError(pela, "NotLogAuthorOrAdmin");
    });

    it("only admin can grant roles and pause; pause blocks writes", async () => {
      const { pela, admin, owner, stranger, EDITOR } = await loadFixture(withPechi);
      await expect(pela.connect(owner).grantRole(EDITOR, stranger.address))
        .to.be.revertedWithCustomError(pela, "AccessControlUnauthorizedAccount");
      await expect(pela.connect(owner).pause())
        .to.be.revertedWithCustomError(pela, "AccessControlUnauthorizedAccount");

      await pela.connect(admin).pause();
      await expect(pela.connect(owner).registerPet("Bella", "", 0))
        .to.be.revertedWithCustomError(pela, "EnforcedPause");
      expect((await pela.getPet(1)).name).to.equal("Pechi"); // reads still work

      await pela.connect(admin).unpause();
      await expect(pela.connect(owner).registerPet("Bella", "", 0)).to.emit(pela, "PetRegistered");
    });
  });
});
