import "../../adapter";
import { runFieldInputContractSuite } from "../../testing/fieldInputContract";
import { variantFieldFixture, primitiveVariantFieldFixture } from "./testFixture";
import { VariantFieldAdmin } from "./Field";

runFieldInputContractSuite({
  fixture: variantFieldFixture,
  Component: VariantFieldAdmin,
});

runFieldInputContractSuite({
  fixture: primitiveVariantFieldFixture,
  Component: VariantFieldAdmin,
});
