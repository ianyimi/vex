import { runColumnDefSuite } from "../../testing/columnDefSuite";
import { selectFieldFixture, scalarSelectFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: selectFieldFixture });
runColumnDefSuite({ fixture: scalarSelectFieldFixture });
