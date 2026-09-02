/**
 * Simple Time Picker
 * Check out the live demo at https://shadcn-datetime-picker-pro.vercel.app/
 * Find the latest source code at https://github.com/huybuidac/shadcn-datetime-picker
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { cn } from "../../../styles/utils";
import { Clock, ChevronDownIcon, CheckIcon } from "lucide-react";
import { ScrollArea } from "../scroll-area";
import {
  format,
  parse,
  setHours,
  startOfHour,
  endOfHour,
  setMinutes,
  startOfMinute,
  endOfMinute,
  setSeconds,
  startOfDay,
  endOfDay,
  addHours,
  subHours,
  setMilliseconds,
} from "date-fns";

interface SimpleTimeOption {
  value: any;
  label: string;
  disabled?: boolean;
}

const AM_VALUE = 0;
const PM_VALUE = 1;

/**
 * Standalone time picker rendered as a popover with scrollable hour, minute,
 * second, and optional AM/PM columns. Calls `onChange` whenever any time
 * component changes. Use inside a `modal` context (e.g. a dialog) by passing
 * `modal={true}` to keep the popover accessible.
 */
export function SimpleTimePicker({
  value,
  onChange,
  use12HourFormat,
  min,
  max,
  disabled,
  modal,
}: {
  use12HourFormat?: boolean;
  value: Date;
  // eslint-disable-next-line no-unused-vars
  onChange: (date: Date) => void;
  min?: Date;
  max?: Date;
  disabled?: boolean;
  className?: string;
  modal?: boolean;
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
  const [open, setOpen] = useState(false);
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

  const hours: SimpleTimeOption[] = useMemo(
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
  const minutes: SimpleTimeOption[] = useMemo(() => {
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
  const seconds: SimpleTimeOption[] = useMemo(() => {
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
    (v: SimpleTimeOption) => {
      setHour(v.value);
    },
    [],
  );

  const onMinuteChange = useCallback(
    (v: SimpleTimeOption) => {
      setMinute(v.value);
    },
    [],
  );

  const onSecondChange = useCallback(
    (v: SimpleTimeOption) => {
      setSecond(v.value);
    },
    [],
  );

  const onAmpmChange = useCallback(
    (v: SimpleTimeOption) => {
      setAmpm(v.value);
    },
    [],
  );

  // Counter to detect infinite loops in development
  const renderCount = useRef(0);

  // Update the time when components change
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
      second,
      ampm,
    });

    // Normalize both times to seconds precision for comparison (ignore milliseconds)
    const newTimeSeconds = Math.floor(newTime.getTime() / 1000);
    const currentTimeSeconds = Math.floor(value.getTime() / 1000);

    // Only call onChange if the time actually changed (ignoring milliseconds)
    if (newTimeSeconds !== currentTimeSeconds) {
      renderCount.current++;
      if (renderCount.current > 100) {
        console.error('SimpleTimePicker: Possible infinite loop detected - onChange called >100 times', {
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
  }, [hour, minute, second, ampm, use12HourFormat, formatStr, value]);

  const display = useMemo(() => {
    return format(value, use12HourFormat ? "hh:mm:ss a" : "HH:mm:ss");
  }, [value, use12HourFormat]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger
        nativeButton={false}
        render={(props) => (
          <div
            {...props}
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex h-9 px-3 items-center justify-between cursor-pointer font-normal border border-input rounded-md text-sm shadow-sm",
              disabled && "opacity-50 cursor-not-allowed",
              props.className,
            )}
          >
            <Clock className="mr-2 size-4" />
            {display}
            <ChevronDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </div>
        )}
      />
      <PopoverContent className="p-0 w-auto" side="top">
        <div className="flex flex-col gap-2 p-2">
          <div className="flex h-56 gap-1">
            <ScrollArea className="h-full w-20">
              <div className="flex flex-col items-stretch pb-48">
                {hours.map((v) => (
                  <div
                    ref={v.value === hour ? hourRef : undefined}
                    key={v.value}
                  >
                    <TimeItem
                      option={v}
                      selected={v.value === hour}
                      onSelect={onHourChange}
                      disabled={v.disabled}
                      className="h-8"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
            <ScrollArea className="h-full w-20">
              <div className="flex flex-col items-stretch pb-48">
                {minutes.map((v) => (
                  <div
                    ref={v.value === minute ? minuteRef : undefined}
                    key={v.value}
                  >
                    <TimeItem
                      option={v}
                      selected={v.value === minute}
                      onSelect={onMinuteChange}
                      disabled={v.disabled}
                      className="h-8"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
            <ScrollArea className="h-full w-20">
              <div className="flex flex-col items-stretch pb-48">
                {seconds.map((v) => (
                  <div
                    ref={v.value === second ? secondRef : undefined}
                    key={v.value}
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
  option: SimpleTimeOption;
  selected: boolean;
  // eslint-disable-next-line no-unused-vars
  onSelect: (option: SimpleTimeOption) => void;
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
    date = setHours(
      setMinutes(setSeconds(setMilliseconds(value, 0), second), minute),
      hour,
    );
  }
  // Clear milliseconds to prevent infinite loops from millisecond precision differences
  date.setMilliseconds(0);
  return date;
}
