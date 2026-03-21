"use client";

import { useEffect, useRef } from "react";
import { driver, type Config } from "driver.js";
import "driver.js/dist/driver.css";

/**
 * Build tour steps with navigation support.
 * Steps that target page-specific elements (like the create button)
 * navigate the user to the correct page first.
 */
function buildTourConfig(props: {
  basePath: string;
  exampleCollection?: string;
  onComplete: () => void;
  navigate: (path: string) => void;
}): Config {
  const collectionPath = props.exampleCollection
    ? `${props.basePath}/${props.exampleCollection}`
    : null;

  return {
    showProgress: true,
    allowClose: true,
    doneBtnText: "Finish",
    nextBtnText: "Next",
    prevBtnText: "Back",
    onDestroyed: () => {
      props.onComplete();
    },
    steps: [
      {
        popover: {
          title: "Welcome to VEX CMS! 👋",
          description:
            "Let's take a quick tour of your admin panel. You'll learn where to find your content, how to create documents, and manage your account. You can exit at any time.",
        },
      },
      {
        element: '[data-tour="sidebar-collections"]',
        popover: {
          title: "Collections",
          description:
            "Your content is organized into collections. Each collection is a content type — like pages, headers, or themes. Click any collection to view and manage its documents.",
          onNextClick: () => {
            if (collectionPath) {
              props.navigate(collectionPath);
              // Wait for navigation and page render before advancing
              setTimeout(() => {
                const driverInstance = (window as any).__vexTourDriver;
                if (driverInstance) driverInstance.moveNext();
              }, 800);
            } else {
              const driverInstance = (window as any).__vexTourDriver;
              if (driverInstance) driverInstance.moveNext();
            }
          },
        },
      },
      ...(collectionPath
        ? [
            {
              element: '[data-tour="document-list"]',
              popover: {
                title: "Document List",
                description:
                  "This is where all documents in a collection are listed. You can sort, search, and click any row to edit it.",
              },
            },
            {
              element: '[data-tour="create-document"]',
              popover: {
                title: "Create a Document",
                description:
                  "Click this button to create a new document. Each document has typed fields that you defined in your vex.config.ts.",
                onNextClick: () => {
                  // Navigate back to admin root for the remaining steps
                  props.navigate(props.basePath);
                  setTimeout(() => {
                    const driverInstance = (window as any).__vexTourDriver;
                    if (driverInstance) driverInstance.moveNext();
                  }, 800);
                },
              },
            },
          ]
        : []),
      {
        element: '[data-tour="user-menu"]',
        popover: {
          title: "Your Account",
          description:
            "Access your profile or sign out from here. As an admin, you can also impersonate other users to test their permissions.",
        },
      },
      {
        popover: {
          title: "You're All Set! 🎉",
          description: collectionPath
            ? "Select a collection in the sidebar to start creating content. You can customize your collections anytime in vex.config.ts."
            : "Add collections to your vex.config.ts to start building your content model. Run `pnpm vex:dev` to generate the schema.",
        },
      },
    ],
  };
}

export function OnboardingTour(props: {
  active: boolean;
  onComplete: () => void;
  basePath: string;
  exampleCollection?: string;
  navigate: (path: string) => void;
}) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  useEffect(() => {
    if (!props.active) return;

    const config = buildTourConfig({
      basePath: props.basePath,
      exampleCollection: props.exampleCollection,
      onComplete: props.onComplete,
      navigate: props.navigate,
    });

    const driverInstance = driver(config);
    driverRef.current = driverInstance;
    // Store globally so step callbacks can access it
    (window as any).__vexTourDriver = driverInstance;

    // Small delay to let the admin panel render fully
    const timer = setTimeout(() => {
      driverInstance.drive();
    }, 500);

    return () => {
      clearTimeout(timer);
      driverInstance.destroy();
      driverRef.current = null;
      delete (window as any).__vexTourDriver;
    };
  }, [props.active, props.onComplete, props.basePath, props.exampleCollection, props.navigate]);

  return null;
}
