"use client";

import { useEffect, useMemo, useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import type { TabsField } from "@vexcms/core";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Badge } from "../../ui/badge";
import { useFailedSubmitAttempt, useFieldErrorCounts } from "../../forms/useFieldErrorCount";
import { useFieldSetsVisible } from "../useFieldCondition";
import {
  dataFieldNames,
  fieldName,
  FieldLayoutItem,
  fieldWidth,
  renderField,
  isTabVisible,
  tabValue,
  visibleFieldEntries,
  type RenderFieldsContext,
} from "../RenderFields";

/**
 * The error-count names for one tab — a named tab's fields store under its
 * `name`, so it counts every error there; an unnamed tab counts its own
 * hoisted fields.
 *
 * @param tab - The tab to compute error-count names for.
 * @param namePrefix - The dot-joined prefix for the enclosing form path, if any.
 * @returns The field paths whose error counts belong to this tab.
 */
function tabErrorNames(tab: TabsField["tabs"][number], namePrefix: string | undefined): string[] {
  if (tab.name === undefined) return dataFieldNames({ fields: tab.fields, namePrefix });
  return [namePrefix ? `${namePrefix}.${tab.name}` : tab.name];
}

/**
 * One tab trigger, badged with its tab's error count.
 *
 * @returns The tab trigger element.
 */
function FormTabsTrigger(props: { tab: TabsField["tabs"][number]; errorCount: number }) {
  return (
    <TabsTrigger value={tabValue(props.tab)} className="gap-1.5">
      {props.tab.label}
      {props.errorCount > 0 && <Badge variant="destructive">{props.errorCount}</Badge>}
    </TabsTrigger>
  );
}

/**
 * Renders a `tabs()` field as a `Tabs` widget — one trigger per tab, each
 * badged with its own error count. A tab renders only while its own
 * `admin.condition` (AND-ed with the field's) leaves a visible field and, under
 * `context.fieldKeys`, something readable. The FIRST visible tab with
 * `defaultOpen: true` is the initially selected tab (no error if several are
 * set); otherwise the first visible tab — also the fallback whenever the
 * selected tab stops being visible.
 *
 * Only the active panel renders, plus any inactive panel holding an error, so
 * its fields stay registered and show their messages; after a failed submit
 * the first errored tab is selected unless the active one already has an
 * error.
 *
 * Only persists its active tab in `?<fieldKey>=` (via `nuqs`) when rendered
 * at `context.isTopLevel` — every nested `tabs()` field (inside a `row()`/
 * `collapsible()`/another tab's own `fields`) keeps local `useState`.
 *
 * @param props.field - The `tabs()` field to render.
 * @param props.fieldKey - This field's own key — the `?<fieldKey>=` param name.
 * @param props.context - The {@link RenderFieldsContext} from the enclosing `RenderFields` call.
 * @returns The tabs widget rendering this field's tabs.
 */
export function FormTabs(props: {
  field: TabsField;
  fieldKey: string;
  context: RenderFieldsContext;
}) {
  const { field, fieldKey, context } = props;
  const fieldSets = useMemo(
    () => field.tabs.map((tab) => ({ [fieldKey]: { ...field, tabs: [tab] } })),
    [field, fieldKey],
  );
  const tabVisibility = useFieldSetsVisible({ fieldSets, namePrefix: context.namePrefix });
  const tabs = field.tabs.filter(
    (tab, index) =>
      tabVisibility[index] === true && isTabVisible({ tab, fieldKeys: context.fieldKeys }),
  );
  const defaultTab = tabs.find((tab) => tab.defaultOpen === true) ?? tabs[0];
  const defaultValue = defaultTab ? tabValue(defaultTab) : "";
  const useUrlState = context.isTopLevel === true;

  const [urlTab, setUrlTab] = useQueryState(
    fieldKey,
    parseAsString.withDefault(defaultValue),
  );
  const [localTab, setLocalTab] = useState(defaultValue);
  const selectedTab = useUrlState ? urlTab : localTab;
  const activeTab = tabs.some((tab) => tabValue(tab) === selectedTab) ? selectedTab : defaultValue;

  const namePrefix = context.namePrefix;
  const nameSets = useMemo(
    () => field.tabs.map((tab) => tabErrorNames(tab, namePrefix)),
    [field.tabs, namePrefix],
  );
  const errorCounts = useFieldErrorCounts({ nameSets });
  const errorCountOf = (tab: TabsField["tabs"][number]) =>
    errorCounts[field.tabs.indexOf(tab)] ?? 0;

  function selectTab(value: string) {
    if (useUrlState) void setUrlTab(value);
    else setLocalTab(value);
  }

  const failedSubmitAttempt = useFailedSubmitAttempt();
  useEffect(() => {
    if (failedSubmitAttempt === 0) return;
    const active = tabs.find((tab) => tabValue(tab) === activeTab);
    if (active && errorCountOf(active) > 0) return;
    const firstErrored = tabs.find((tab) => errorCountOf(tab) > 0);
    if (firstErrored) selectTab(tabValue(firstErrored));
  }, [failedSubmitAttempt]);

  if (tabs.length === 0) return null;

  return (
    <Tabs
      className="rounded-sm border-2 border-border px-3 py-2"
      value={activeTab}
      onValueChange={(value) => selectTab(value as string)}
    >
      <TabsList variant="line" className="vex-scroll-area h-auto max-w-full justify-start overflow-x-auto pb-1.5">
        {tabs.map((tab) => (
          <FormTabsTrigger key={tabValue(tab)} tab={tab} errorCount={errorCountOf(tab)} />
        ))}
      </TabsList>
      {tabs.map((tab) => {
        // A named tab's fields store as one group-shaped data field keyed by
        // its own `name` (getDataFields's flattening) — the form names
        // rendered here must match that path, so a named tab's own fields
        // render under a namePrefix extended by `tab.name` and, like a
        // group's, are gated by that `name` alone; an unnamed tab's fields
        // hoist straight to the parent level, so its context is unchanged.
        const tabContext: RenderFieldsContext =
          tab.name !== undefined
            ? { ...context, namePrefix: fieldName(context, tab.name), fieldKeys: undefined }
            : context;
        return (
          <TabsContent key={tabValue(tab)} value={tabValue(tab)} keepMounted={errorCountOf(tab) > 0}>
            <div className="flex flex-wrap gap-x-4 gap-y-6">
              {visibleFieldEntries({ fields: tab.fields, fieldKeys: tabContext.fieldKeys }).map(
                ([key, childField]) => (
                  <FieldLayoutItem key={key} width={fieldWidth(childField)}>
                    {renderField({ field: childField, fieldKey: key, context: tabContext })}
                  </FieldLayoutItem>
                ),
              )}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
