# Scientific methods and limits

## Local browser estimates

The browser mode uses OpenChemLib 9.25.2 to generate one seeded 3D conformer with explicit hydrogens. MMFF94 refinement is attempted; the record states whether it succeeded. Gasteiger–Marsili charge equalisation runs for 12 iterations with parameters and an algorithm adapted from RDKit. Potential is evaluated as the sum of atomic point charges divided by distance in bohr, giving hartree/e units.

The display envelope is a smooth union of atom-centred van der Waals spheres. It is not calculated electron density. Radii use Bondi values, with the boron value from Mantina et al. The selected colour range is fixed and values beyond it are clipped.

Twenty-five charge fixtures match RDKit 2025.09.6 values to a tolerance of 1e-10. F-, Cl-, Br- and I-containing examples were also checked through local conformer generation and signed surface construction. These checks establish consistency with that charge implementation for the tested structures; they do not validate the maps against quantum ESP across arbitrary chemistry. OpenChemLib's hybridisation and conjugation perception can differ in other environments.

Limitations include one conformer, no solvent, no electronic polarisation, no directional lone-pair density and no halogen sigma-holes. Use for qualitative polarity demonstrations, not quantitative energies, reaction selectivity or halogen-bonding predictions. Current limits are 40 non-H atoms, 180 total atoms after H addition and 60 seconds per calculation. Unsupported chemistry can fail inside those limits.

## Quantum-derived examples

Formaldehyde, ethanol, acetone, benzene, acetic acid and methylamine use converged PySCF RHF/6-31G* gas-phase calculations. Geometry comes from RDKit ETKDG embedding and MMFF94 optimisation, without quantum geometry optimisation. The density grid is 64³ with a 4-bohr margin. The surfaces use density isovalues 0.001, 0.002 and 0.005 e/bohr³.

ESP is evaluated directly at surface vertices from the nuclear Coulomb potential minus the electronic contribution. These introductory calculations are method-, geometry- and conformer-dependent; being quantum-derived is not a universal accuracy guarantee. Electron density determines the surface shape, while electrostatic potential determines the colour.

## Imported calculations

Matching density and potential cube files are accepted after grid and atom-coordinate checks. Declared units and calculation provenance remain the user's responsibility. Bonds are inferred from distances and their orders are not recovered from cube data.

## Data and software sources

- [OpenChemLib JS](https://cheminfo.github.io/openchemlib-js/)
- [RDKit partial-charge source](https://github.com/rdkit/rdkit/tree/master/Code/GraphMol/PartialCharges)
- Gasteiger, J.; Marsili, M. Iterative partial equalization of orbital electronegativity—a rapid access to atomic charges. Tetrahedron 1980, 36, 3219–3228.
- [Bondi: van der Waals Volumes and Radii](https://doi.org/10.1021/j100785a001)
- [Mantina et al.: Consistent van der Waals Radii for the Whole Main Group](https://doi.org/10.1021/jp8111556)
- [PySCF density and potential generation](https://pyscf.org/_modules/pyscf/tools/cubegen.html)
- [Psi4 potential documentation](https://psicode.org/psi4manual/master/cubeprop.html)

See [third-party licensing](../THIRD-PARTY-NOTICES.md). Citations acknowledge methods and data; they do not imply endorsement by their authors.
