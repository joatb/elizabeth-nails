/**
 * Barrel de la capa `ui`
 * Reexporta atoms, molecules, organisms y templates para facilitar imports desde:
 *   import { AtomButtonComponent } from '../../ui';
 *
 * Mantener tipado estricto en TypeScript.
 */

export * from "./atoms";
export * from "./molecules";
export * from "./organisms";
export * from "./templates";

// Exportaciones agrupadas (opcionales) para acceder con namespaces:
//   import * as UI from '../../ui';
//   const Btn = UI.Atoms.AtomButtonComponent;
export * as Atoms from "./atoms";
export * as Molecules from "./molecules";
export * as Organisms from "./organisms";
export * as Templates from "./templates";
