/**
 * Shadcn Datetime Picker with support for timezone, date and time selection, minimum and maximum date limits, and 12-hour format...
 * Check out the live demo at https://shadcn-datetime-picker-pro.vercel.app/
 * Find the latest source code at https://github.com/huybuidac/shadcn-datetime-picker
 */
"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  endOfHour,
  endOfMinute,
  format,
  parse,
  getMonth,
  getYear,
  setHours,
  setMinutes,
  setMonth as setMonthFns,
  setSeconds,
  setYear,
  startOfHour,
  startOfMinute,
  startOfYear,
  startOfMonth,
  endOfMonth,
  endOfYear,
  addMonths,
  subMonths,
  setMilliseconds,
  addHours,
  subHours,
  startOfDay,
  endOfDay,
} from "date-fns";
import {
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  Clock,
  XCircle,
} from "lucide-react";
import { DayPicker, Matcher, TZDate } from "react-day-picker";

import { cn } from "../../../styles/utils";
import { Button, buttonVariants } from "../button";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { ScrollArea } from "../scroll-area";

export type CalendarProps = Omit<
  React.ComponentProps<typeof DayPicker>,
  "mode"
>;

const AM_VALUE = 0;
const PM_VALUE = 1;

export type DateTimePickerProps = {
  /**
   * The modality of the popover. When set to true, interaction with outside elements will be disabled and only popover content will be visible to screen readers.
   * If you want to use the datetime picker inside a dialog, you should set this to true.
   * @default false
   */
  modal?: boolean;
  /**
   * The datetime value to display and control.
   */
  value: Date | undefined;
  /**
   * Callback function to handle datetime changes.
   */
  // eslint-disable-next-line no-unused-vars
  onChange: (date: Date | undefined) => void;
  /**
   * The minimum datetime value allowed.
   * @default undefined
   */
  min?: Date;
  /**
   * The maximum datetime value allowed.
   */
  max?: Date;
  /**
   * The timezone to display the datetime in, based on the date-fns.
   * For a complete list of valid time zone identifiers, refer to:
   * https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
   * @default undefined
   */
  timezone?: string;
  /**
   * Whether the datetime picker is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether to show the time picker.
   * @default false
   */
  hideTime?: boolean;
  /**
   * Whether to use 12-hour format.
   * @default false
   */
  use12HourFormat?: boolean;
  /**
   * Whether to show the clear button.
   * @default false
   */
  clearable?: boolean;
  /**
   * Custom class names for the component.
   */
  classNames?: {
    /**
     * Custom class names for the trigger (the button that opens the picker).
     */
    trigger?: string;
  };
  timePicker?: {
    hour?: boolean;
    minute?: boolean;
    second?: boolean;
  };
  /**
   * Custom render function for the trigger.
   */
  // eslint-disable-next-line no-unused-vars
  renderTrigger?: (props: DateTimeRenderTriggerProps) => React.ReactNode;
};

export type DateTimeRenderTriggerProps = {
  value: Date | undefined;
  open: boolean;
  timezone?: string;
  disabled?: boolean;
  use12HourFormat?: boolean;
  // eslint-disable-next-line no-unused-vars
  setOpen: (open: boolean) => void;
};

/**
 * Popover-based date and time picker built on DayPicker and shadcn Popover.
 *
 * Renders a trigger button showing the formatted date/time; clicking it opens a
 * calendar with optional month/year drill-down and an inline time picker.
 * Calls `onChange` only when the user clicks "Done". Pass `hideTime` to show
 * a date-only picker, or `use12HourFormat` for 12-hour AM/PM mode.
 *
 * @param props - {@link DateTimePickerProps} merged with DayPicker props
 */
export function DateTimePicker({
  value,
  onChange,
  renderTrigger,
  min,
  max,
  timezone,
  hideTime,
  use12HourFormat,
  disabled,
  clearable,
  classNames,
  timePicker,
  modal = false,
  ...props
}: DateTimePickerProps & CalendarProps) {
  const [open, setOpen] = useState(false);
  const [monthYearPicker, setMonthYearPicker] = useState<
    "month" | "year" | false
  >(false);
  const initDate = useMemo(
    () => new TZDate(value || new Date(), timezone),
    [value, timezone],
  );

  const [month, setMonth] = useState<Date>(initDate);
  const [date, setDate] = useState<Date>(initDate);

  const endMonth = useMemo(() => {
    return setYear(month, getYear(month) + 1);
  }, [month]);
  const minDate = useMemo(
    () => (min ? new TZDate(min, timezone) : undefined),
    [min, timezone],
  );
  const maxDate = useMemo(
    () => (max ? new TZDate(max, timezone) : undefined),
    [max, timezone],
  );

  const onDayChanged = useCallback(
    (d: Date) => {
      const newDate = new Date(d);
      newDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds());
      if (min && newDate < min) {
        newDate.setHours(min.getHours(), min.getMinutes(), min.getSeconds());
      }
      if (max && newDate > max) {
        newDate.setHours(max.getHours(), max.getMinutes(), max.getSeconds());
      }
      setDate(newDate);
    },
    [date, min, max],
  );
  const onSubmit = useCallback(() => {
    onChange(new Date(date));
    setOpen(false);
  }, [date, onChange]);

  const handleTimeChange = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const onMonthYearChanged = useCallback(
    (d: Date, mode: "month" | "year") => {
      setMonth(d);
      if (mode === "year") {
        setMonthYearPicker("month");
      } else {
        setMonthYearPicker(false);
      }
    },
    [setMonth, setMonthYearPicker],
  );
  const onNextMonth = useCallback(() => {
    setMonth(addMonths(month, 1));
  }, [month]);
  const onPrevMonth = useCallback(() => {
    setMonth(subMonths(month, 1));
  }, [month]);

  useEffect(() => {
    if (open) {
      setDate(initDate);
      setMonth(initDate);
      setMonthYearPicker(false);
    }
  }, [open, initDate]);

  const displayValue = useMemo(() => {
    if (!open && !value) return value;
    return open ? date : initDate;
  }, [date, value, open]);

  const dislayFormat = useMemo(() => {
    if (!displayValue) return "Pick a date";
    return format(
      displayValue,
      `${!hideTime ? "MMM" : "MMMM"} d, yyyy${!hideTime ? (use12HourFormat ? " hh:mm:ss a" : " HH:mm:ss") : ""}`,
    );
  }, [displayValue, hideTime, use12HourFormat]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        nativeButton={false}
        render={
          renderTrigger
            ? (props) => (
                <div {...props}>
                  {renderTrigger({
                    value: displayValue,
                    open,
                    timezone,
                    disabled,
                    use12HourFormat,
                    setOpen,
                  })}
                </div>
              )
            : (props) => (
                <div
                  {...props}
                  className={cn(
                    "flex w-full cursor-pointer items-center h-9 ps-3 pe-1 font-normal border border-input rounded-md text-sm shadow-sm",
                    !displayValue && "text-muted-foreground",
                    (!clearable || !value) && "pe-3",
                    disabled && "opacity-50 cursor-not-allowed",
                    classNames?.trigger,
                    props.className,
                  )}
                >
                  <div className="flex-grow flex items-center">
                    <CalendarIcon className="mr-2 size-4" />
                    {dislayFormat}
                  </div>
                  {clearable && value && (
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label="Clear date"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "size-6 p-1 ms-1",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onChange(undefined);
                        setOpen(false);
                      }}
                    >
                      <XCircle className="size-4" />
                    </button>
                  )}
                </div>
              )
        }
      />
      <PopoverContent className="w-auto p-2">
        <div className="flex items-center justify-between">
          <div className="text-md font-bold ms-2 flex items-center cursor-pointer">
            <div>
              <span
                onClick={() =>
                  setMonthYearPicker(
                    monthYearPicker === "month" ? false : "month",
                  )
                }
              >
                {format(month, "MMMM")}
              </span>
              <span
                className="ms-1"
                onClick={() =>
                  setMonthYearPicker(
                    monthYearPicker === "year" ? false : "year",
                  )
                }
              >
                {format(month, "yyyy")}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setMonthYearPicker(monthYearPicker ? false : "year")
              }
            >
              {monthYearPicker ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </Button>
          </div>
          <div
            className={cn("flex space-x-2", monthYearPicker ? "hidden" : "")}
          >
            <Button variant="ghost" size="icon" onClick={onPrevMonth}>
              <ChevronLeftIcon />
            </Button>
            <Button variant="ghost" size="icon" onClick={onNextMonth}>
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
        <div className="relative overflow-hidden">
          <DayPicker
            timeZone={timezone}
            mode="single"
            selected={date}
            onSelect={(d) => d && onDayChanged(d)}
            month={month}
            endMonth={endMonth}
            disabled={
              [
                max ? { after: max } : null,
                min ? { before: min } : null,
              ].filter(Boolean) as Matcher[]
            }
            onMonthChange={setMonth}
            classNames={{
              dropdowns: "flex w-full gap-2",
              months: "flex w-full h-fit",
              month: "flex flex-col w-full",
              month_caption: "hidden",
              button_previous: "hidden",
              button_next: "hidden",
              month_grid: "w-full border-collapse",
              weekdays: "flex justify-between mt-2",
              weekday:
                "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              week: "flex w-full justify-between mt-2",
              day: "h-9 w-9 text-center text-sm p-0 relative flex items-center justify-center [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 rounded-1",
              day_button: cn(
                buttonVariants({ variant: "ghost" }),
                "size-9 rounded-md p-0 font-normal aria-selected:opacity-100",
              ),
              range_end: "day-range-end",
              selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-l-md rounded-r-md",
              today: "bg-accent text-accent-foreground",
              outside:
                "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              disabled: "text-muted-foreground opacity-50",
              range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              hidden: "invisible",
            }}
            showOutsideDays={true}
            {...props}
          />
          <div
            className={cn(
              "absolute top-0 left-0 bottom-0 right-0",
              monthYearPicker ? "bg-popover" : "hidden",
            )}
          ></div>
          <MonthYearPicker
            value={month}
            mode={monthYearPicker as any}
            onChange={onMonthYearChanged}
            minDate={minDate}
            maxDate={maxDate}
            className={cn(
              "absolute top-0 left-0 bottom-0 right-0",
              monthYearPicker ? "" : "hidden",
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          {!hideTime && (
            <TimePicker
              timePicker={timePicker}
              value={date}
              onChange={handleTimeChange}
              use12HourFormat={use12HourFormat}
              min={minDate}
              max={maxDate}
            />
          )}
          <div className="flex flex-row-reverse items-center justify-between">
            <Button className="ms-2 h-7 px-2" onClick={onSubmit}>
              Done
            </Button>
            {timezone && (
              <div className="text-sm">
                <span>Timezone:</span>
                <span className="font-semibold ms-1">{timezone}</span>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MonthYearPicker({
  value,
  minDate,
  maxDate,
  mode = "month",
  onChange,
  className,
}: {
  value: Date;
  mode: "month" | "year";
  minDate?: Date;
  maxDate?: Date;
  // eslint-disable-next-line no-unused-vars
  onChange: (value: Date, mode: "month" | "year") => void;
  className?: string;
}) {
  const yearRef = useRef<HTMLDivElement>(null);
  const years = useMemo(() => {
    const years: TimeOption[] = [];
    for (let i = 1912; i < 2100; i++) {
      let disabled = false;
      const startY = startOfYear(setYear(value, i));
      const endY = endOfYear(setYear(value, i));
      if (minDate && endY < minDate) disabled = true;
      if (maxDate && startY > maxDate) disabled = true;
      years.push({ value: i, label: i.toString(), disabled });
    }
    return years;
  }, [value]);
  const months = useMemo(() => {
    const months: TimeOption[] = [];
    for (let i = 0; i < 12; i++) {
      let disabled = false;
      const startM = startOfMonth(setMonthFns(value, i));
      const endM = endOfMonth(setMonthFns(value, i));
      if (minDate && endM < minDate) disabled = true;
      if (maxDate && startM > maxDate) disabled = true;
      months.push({ value: i, label: format(new Date(0, i), "MMM"), disabled });
    }
    return months;
  }, [value]);

  const onYearChange = useCallback(
    (v: TimeOption) => {
      let newDate = setYear(value, v.value);
      if (minDate && newDate < minDate) {
        newDate = setMonthFns(newDate, getMonth(minDate));
      }
      if (maxDate && newDate > maxDate) {
        newDate = setMonthFns(newDate, getMonth(maxDate));
      }
      onChange(newDate, "year");
    },
    [onChange, value, minDate, maxDate],
  );

  useEffect(() => {
    if (mode === "year") {
      yearRef.current?.scrollIntoView({ behavior: "auto", block: "center" });
    }
  }, [mode, value]);
  return (
    <div className={cn(className)}>
      <ScrollArea className="h-full">
        {mode === "year" && (
          <div className="grid grid-cols-4">
            {years.map((year) => (
              <div
                key={year.value}
                ref={year.value === getYear(value) ? yearRef : undefined}
              >
                <Button
                  disabled={year.disabled}
                  variant={getYear(value) === year.value ? "default" : "ghost"}
                  className="rounded-full"
                  onClick={() => onYearChange(year)}
                >
                  {year.label}
                </Button>
              </div>
            ))}
          </div>
        )}
        {mode === "month" && (
          <div className="grid grid-cols-3 gap-4">
            {months.map((month) => (
              <Button
                key={month.value}
                size="lg"
                disabled={month.disabled}
                variant={getMonth(value) === month.value ? "default" : "ghost"}
                className="rounded-full"
                onClick={() =>
                  onChange(setMonthFns(value, month.value), "month")
                }
              >
                {month.label}
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface TimeOption {
  value: number;
  label: string;
  disabled: boolean;
}

function TimePicker({
  value,
  onChange,
  use12HourFormat,
  min,
  max,
  timePicker,
}: {
  use12HourFormat?: boolean;
  value: Date;
  // eslint-disable-next-line no-unused-vars
  onChange: (date: Date) => void;
  min?: Date;
  max?: Date;
  timePicker?: DateTimePickerProps["timePicker"];
}) {
  // hours24h = HH
  // hours12h = hh
  const formatStr = useMemo(
    () =>
      use12HourFormat
        ? "yyyy-MM-dd hh:mm:ss.SSS a xxxx"
        : "yyyy-MM-dd HH:mm:ss.SSS xxxx",
    [use12HourFormat],
  );
  const [ampm, setAmpm] = useState(
    format(value, "a") === "AM" ? AM_VALUE : PM_VALUE,
  );
  const [hour, setHour] = useState(
    use12HourFormat ? +format(value, "hh") : value.getHours(),
  );
  const [minute, setMinute] = useState(value.getMinutes());
  const [second, setSecond] = useState(value.getSeconds());

  // Track if this is the initial mount
  const isInitialMount = useRef(true);
  const isUpdatingFromProp = useRef(false);
  // Ref for onChange to avoid it being in dependency array
  const onChangeRef = useRef(onChange);

  // Keep ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Extract stable boolean from timePicker to avoid object in dependency array
  const secondEnabled = timePicker?.second !== false;

  // Reset seconds to 0 when seconds picker is disabled
  useEffect(() => {
    if (timePicker && !timePicker.second && second !== 0) {
      setSecond(0);
    }
  }, [timePicker?.second]);

  // Sync internal state when value prop changes externally
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only sync if we're not currently updating from internal state
    if (!isUpdatingFromProp.current) {
      const newAmpm = format(value, "a") === "AM" ? AM_VALUE : PM_VALUE;
      const newHour = use12HourFormat ? +format(value, "hh") : value.getHours();
      const newMinute = value.getMinutes();
      const newSecond = value.getSeconds();

      // Only update if actually different
      if (hour !== newHour || minute !== newMinute || second !== newSecond || ampm !== newAmpm) {
        isUpdatingFromProp.current = true;
        setAmpm(newAmpm);
        setHour(newHour);
        setMinute(newMinute);
        setSecond(newSecond);
        // Reset flag after state updates
        setTimeout(() => {
          isUpdatingFromProp.current = false;
        }, 0);
      }
    }
  }, [value.getTime(), use12HourFormat]);

  const _hourIn24h = useMemo(() => {
    return use12HourFormat ? (hour % 12) + ampm * 12 : hour;
  }, [hour, use12HourFormat, ampm]);

  const hours: TimeOption[] = useMemo(
    () =>
      Array.from({ length: use12HourFormat ? 12 : 24 }, (_, i) => {
        let disabled = false;
        const hourValue = use12HourFormat ? (i === 0 ? 12 : i) : i;
        const hDate = setHours(value, use12HourFormat ? i + ampm * 12 : i);
        const hStart = startOfHour(hDate);
        const hEnd = endOfHour(hDate);
        if (min && hEnd < min) disabled = true;
        if (max && hStart > max) disabled = true;
        return {
          value: hourValue,
          label: hourValue.toString().padStart(2, "0"),
          disabled,
        };
      }),
    [value, min, max, use12HourFormat, ampm],
  );
  const minutes: TimeOption[] = useMemo(() => {
    const anchorDate = setHours(value, _hourIn24h);
    return Array.from({ length: 60 }, (_, i) => {
      let disabled = false;
      const mDate = setMinutes(anchorDate, i);
      const mStart = startOfMinute(mDate);
      const mEnd = endOfMinute(mDate);
      if (min && mEnd < min) disabled = true;
      if (max && mStart > max) disabled = true;
      return {
        value: i,
        label: i.toString().padStart(2, "0"),
        disabled,
      };
    });
  }, [value, min, max, _hourIn24h]);
  const seconds: TimeOption[] = useMemo(() => {
    const anchorDate = setMilliseconds(
      setMinutes(setHours(value, _hourIn24h), minute),
      0,
    );
    const _min = min ? setMilliseconds(min, 0) : undefined;
    const _max = max ? setMilliseconds(max, 0) : undefined;
    return Array.from({ length: 60 }, (_, i) => {
      let disabled = false;
      const sDate = setSeconds(anchorDate, i);
      if (_min && sDate < _min) disabled = true;
      if (_max && sDate > _max) disabled = true;
      return {
        value: i,
        label: i.toString().padStart(2, "0"),
        disabled,
      };
    });
  }, [value, minute, min, max, _hourIn24h]);
  const ampmOptions = useMemo(() => {
    const startD = startOfDay(value);
    const endD = endOfDay(value);
    return [
      { value: AM_VALUE, label: "AM" },
      { value: PM_VALUE, label: "PM" },
    ].map((v) => {
      let disabled = false;
      const start = addHours(startD, v.value * 12);
      const end = subHours(endD, (1 - v.value) * 12);
      if (min && end < min) disabled = true;
      if (max && start > max) disabled = true;
      return { ...v, disabled };
    });
  }, [value, min, max]);

  const [open, setOpen] = useState(false);

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line no-undef
    const timeoutId = setTimeout(() => {
      if (open) {
        hourRef.current?.scrollIntoView({ behavior: "auto" });
        minuteRef.current?.scrollIntoView({ behavior: "auto" });
        secondRef.current?.scrollIntoView({ behavior: "auto" });
      }
    }, 1);
    // eslint-disable-next-line no-undef
    return () => clearTimeout(timeoutId);
  }, [open]);

  const onHourChange = useCallback(
    (v: TimeOption) => {
      setHour(v.value);
    },
    [],
  );

  const onMinuteChange = useCallback(
    (v: TimeOption) => {
      setMinute(v.value);
    },
    [],
  );

  const onSecondChange = useCallback(
    (v: TimeOption) => {
      setSecond(v.value);
    },
    [],
  );

  const onAmpmChange = useCallback(
    (v: TimeOption) => {
      setAmpm(v.value);
    },
    [],
  );

  // Counter to detect infinite loops in development
  const renderCount = useRef(0);

  // Update the date when time components change
  useEffect(() => {
    // Skip if this is from a prop update
    if (isUpdatingFromProp.current) {
      return;
    }

    // Skip on initial mount
    if (isInitialMount.current) {
      return;
    }

    const newTime = buildTime({
      use12HourFormat,
      value,
      formatStr,
      hour,
      minute,
      second: !secondEnabled ? 0 : second,
      ampm,
    });

    // Normalize both times to seconds precision for comparison (ignore milliseconds)
    const newTimeSeconds = Math.floor(newTime.getTime() / 1000);
    const currentTimeSeconds = Math.floor(value.getTime() / 1000);

    // Only call onChange if the time actually changed (ignoring milliseconds)
    if (newTimeSeconds !== currentTimeSeconds) {
      renderCount.current++;
      if (renderCount.current > 100) {
        console.error('DateTimePicker: Possible infinite loop detected - onChange called >100 times', {
          newTime: newTime.getTime(),
          oldTime: value.getTime(),
          diff: newTime.getTime() - value.getTime(),
        });
        // Stop the loop
        return;
      }
      isUpdatingFromProp.current = true;
      onChangeRef.current(newTime);
      setTimeout(() => {
        isUpdatingFromProp.current = false;
      }, 0);
    }
  }, [hour, minute, second, ampm, use12HourFormat, formatStr, secondEnabled, value]);

  const display = useMemo(() => {
    let arr = [];
    for (const element of ["hour", "minute", "second"]) {
      if (!timePicker || timePicker[element as keyof typeof timePicker]) {
        if (element === "hour") {
          arr.push(use12HourFormat ? "hh" : "HH");
        } else {
          arr.push(element === "minute" ? "mm" : "ss");
        }
      }
    }
    return format(value, arr.join(":") + (use12HourFormat ? " a" : ""));
  }, [value, use12HourFormat, timePicker]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={(props) => (
          <button
            {...props}
            type="button"
            role="combobox"
            aria-expanded={open}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "justify-between",
              props.className,
            )}
          >
            <Clock className="mr-2 size-4" />
            {display}
            <ChevronDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </button>
        )}
      />
      <PopoverContent className="p-0 w-auto" side="top">
        <div className="flex-col gap-2 p-2">
          <div className="flex h-56 gap-1">
            {(!timePicker || timePicker.hour) && (
              <ScrollArea className="h-full w-20">
                <div className="flex flex-col items-stretch pb-48">
                  {hours.map((v) => (
                    <div
                      key={v.value}
                      ref={v.value === hour ? hourRef : undefined}
                    >
                      <TimeItem
                        option={v}
                        selected={v.value === hour}
                        onSelect={onHourChange}
                        className="h-8"
                        disabled={v.disabled}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            {(!timePicker || timePicker.minute) && (
              <ScrollArea className="h-full w-20">
                <div className="flex flex-col items-stretch pb-48">
                  {minutes.map((v) => (
                    <div
                      key={v.value}
                      ref={v.value === minute ? minuteRef : undefined}
                    >
                      <TimeItem
                        option={v}
                        selected={v.value === minute}
                        onSelect={onMinuteChange}
                        className="h-8"
                        disabled={v.disabled}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            {(!timePicker || timePicker.second) && (
              <ScrollArea className="h-full w-20">
                <div className="flex flex-col items-stretch pb-48">
                  {seconds.map((v) => (
                    <div
                      key={v.value}
                      ref={v.value === second ? secondRef : undefined}
                    >
                      <TimeItem
                        option={v}
                        selected={v.value === second}
                        onSelect={onSecondChange}
                        className="h-8"
                        disabled={v.disabled}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            {use12HourFormat && (
              <ScrollArea className="h-full w-20">
                <div className="flex flex-col items-stretch">
                  {ampmOptions.map((v) => (
                    <TimeItem
                      key={v.value}
                      option={v}
                      selected={v.value === ampm}
                      onSelect={onAmpmChange}
                      className="h-8"
                      disabled={v.disabled}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const TimeItem = ({
  option,
  selected,
  onSelect,
  className,
  disabled,
}: {
  option: TimeOption;
  selected: boolean;
  // eslint-disable-next-line no-unused-vars
  onSelect: (option: TimeOption) => void;
  className?: string;
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      className={cn(
        "flex flex-row items-center justify-center w-full px-2 py-1.5 hover:bg-accent rounded-sm disabled:opacity-50",
        className
      )}
      onClick={() => onSelect(option)}
      disabled={disabled}
    >
      <CheckIcon className={cn("size-4 mr-2", !selected && "invisible")} />
      <span className="tabular-nums">{option.label}</span>
    </button>
  );
};

interface BuildTimeOptions {
  use12HourFormat?: boolean;
  value: Date;
  formatStr: string;
  hour: number;
  minute: number;
  second: number;
  ampm: number;
}

function buildTime(options: BuildTimeOptions) {
  const { use12HourFormat, value, formatStr, hour, minute, second, ampm } =
    options;
  let date: Date;
  if (use12HourFormat) {
    const dateStrRaw = format(value, formatStr);
    // yyyy-MM-dd hh:mm:ss.SSS a zzzz
    // 2024-10-14 01:20:07.524 AM GMT+00:00
    let dateStr =
      dateStrRaw.slice(0, 11) +
      hour.toString().padStart(2, "0") +
      dateStrRaw.slice(13);
    dateStr =
      dateStr.slice(0, 14) +
      minute.toString().padStart(2, "0") +
      dateStr.slice(16);
    dateStr =
      dateStr.slice(0, 17) +
      second.toString().padStart(2, "0") +
      dateStr.slice(19);
    dateStr =
      dateStr.slice(0, 24) +
      (ampm == AM_VALUE ? "AM" : "PM") +
      dateStr.slice(26);
    date = parse(dateStr, formatStr, value);
  } else {
    date = setHours(setMinutes(setSeconds(value, second), minute), hour);
  }
  // Clear milliseconds to prevent infinite loops from millisecond precision differences
  date.setMilliseconds(0);
  return date;
}
