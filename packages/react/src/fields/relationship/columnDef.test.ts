import { runColumnDefSuite } from "../../testing/columnDefSuite";
import { relationshipFieldFixture, scalarRelationshipFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: relationshipFieldFixture });
runColumnDefSuite({ fixture: scalarRelationshipFieldFixture });
