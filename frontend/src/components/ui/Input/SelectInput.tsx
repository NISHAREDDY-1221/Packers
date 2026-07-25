// @ts-nocheck
// import { SelectHTMLAttributes, ReactNode, forwardRef } from "react";

// /** Chevron on the <select> itself (background-image); reliable vs. overlay SVG behind native select paint layer. */
// const SELECT_CHEVRON_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23525252' stroke-width='2.25' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`;

// export interface SelectOption {
//   value: string;
//   label: string;
//   disabled?: boolean;
// }

// export interface SelectInputProps
//   extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
//   label?: string | ReactNode;
//   error?: string;
//   required?: boolean;
//   children?: ReactNode;
//   options?: SelectOption[];
//   placeholder?: string;
// }

// const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
//   (
//     {
//       label,
//       error,
//       required,
//       className = "",
//       children,
//       options,
//       placeholder,
//       style,
//       ...props
//     },
//     ref
//   ) => {
//     return (
//       <div className="w-full">
//         {/* Label */}
//         {label && (
//           <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
//             {typeof label === "string" ? (
//               <>
//                 {label}{" "}
//                 {required && (
//                   <span className="text-red-500 dark:text-red-400">*</span>
//                 )}
//               </>
//             ) : (
//               label
//             )}
//           </label>
//         )}

//         <div className="relative w-full">
//           <select
//             ref={ref}
//             {...props}
//             style={{
//               backgroundImage: SELECT_CHEVRON_BG,
//               backgroundSize: "16px 16px",
//               backgroundPosition: "right 0.65rem center",
//               backgroundRepeat: "no-repeat",
//               ...style,
//             }}
//             className={`partner-select-input w-full px-3 py-2 text-xs border rounded-lg 
//             focus:outline-none focus:ring-2 
//             bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
//             appearance-none pr-10 min-h-[36px] 
//             ${
//               error
//                 ? "border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400"
//                 : "border-gray-300 dark:border-gray-600 focus:ring-gray-400 dark:focus:ring-gray-500"
//             }
//             disabled:opacity-100 disabled:text-gray-500 ${className}`}
//           >
//             {/* Placeholder */}
//             {placeholder && (
//               <option value="" disabled={props.value === ""}>
//                 {placeholder}
//               </option>
//             )}

//             {/* Options */}
//             {options
//               ? options.map((option) => (
//                   <option
//                     key={option.value}
//                     value={option.value}
//                     disabled={option.disabled}
//                   >
//                     {option.label}
//                   </option>
//                 ))
//               : children}
//           </select>
//         </div>

//         {/* Error */}
//         {error && (
//           <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">
//             {error}
//           </p>
//         )}
//       </div>
//     );
//   }
// );

// SelectInput.displayName = "SelectInput";

// export default SelectInput;

import {
  SelectHTMLAttributes,
  ReactNode,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  Children,
  isValidElement,
} from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectInputProps
  extends Omit<SelectHTMLAttributes<HTMLButtonElement>, "children"> {
  label?: string | ReactNode;
  error?: string;
  required?: boolean;
  children?: ReactNode;
  options?: SelectOption[];
  placeholder?: string;
  listMaxHeightClass?: string;
}

const SelectInput = forwardRef<HTMLButtonElement, SelectInputProps>(
  (
    {
      label,
      error,
      required,
      className = "",
      children,
      options = [],
      placeholder = "Select option",
      value,
      onChange,
      disabled,
      listMaxHeightClass = "max-h-48",
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isFilterStyle, setIsFilterStyle] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleOutsideClick);

      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
      };
    }, []);

   useEffect(() => {
  let parent = wrapperRef.current?.parentElement;

  let foundFilterStyle = false;

  while (parent) {
    const classes =
      typeof parent.className === "string"
        ? parent.className
        : "";

    if (
      classes.includes("divide-x") ||
      classes.includes("overflow-hidden") ||
      classes.includes("overflow-visible") ||
      classes.includes("lg:max-w-md") ||
      classes.includes("lg:max-w-2xl")
    ) {
      foundFilterStyle = true;
      break;
    }

    parent = parent.parentElement;
  }

  setIsFilterStyle(foundFilterStyle);
}, []);

    // Convert children <option> into options array
    const childOptions: SelectOption[] = useMemo(() => {
      return Children.toArray(children)
        .filter(isValidElement)
        .map((child: any) => ({
          value: child.props.value ?? "",
          label:
            typeof child.props.children === "string"
              ? child.props.children
              : String(child.props.children),
          disabled: child.props.disabled ?? false,
        }));
    }, [children]);

    // Final options
    const finalOptions =
      options.length > 0 ? options : childOptions;

    // Selected option
    const selectedOption = useMemo(() => {
      return finalOptions.find(
        (option) => String(option.value) === String(value)
      );
    }, [finalOptions, value]);

    // Handle select
    const handleSelect = (optionValue: string) => {
      if (disabled) return;

      const syntheticEvent = {
        target: {
          value: optionValue,
          name: props.name,
        },
      } as React.ChangeEvent<HTMLButtonElement>;

      onChange?.(syntheticEvent);

      setIsOpen(false);
    };

    return (
      <div className="w-full" ref={wrapperRef}>
        {/* Label */}
        {label && (
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {typeof label === "string" ? (
              <>
                {label}{" "}
                {required && (
                  <span className="text-red-500 dark:text-red-400">*</span>
                )}
              </>
            ) : (
              label
            )}
          </label>
        )}

        {/* Select Button */}
        <div className="relative">
          <button
            ref={ref}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
            className={`
  w-full
   flex-1
  min-w-0
  text-xs

  flex
  items-center
  justify-between
  gap-2

  transition-all
  duration-200

  focus:outline-none

  text-gray-900
  dark:text-gray-100

  disabled:opacity-100
  disabled:text-gray-500
  disabled:cursor-not-allowed

  ${
    isFilterStyle
      ? `
        border-0
        bg-transparent
        dark:bg-transparent
        shadow-none
        rounded-none
        min-h-0
        px-0
        py-0
        focus:ring-0
        focus:border-0
        text-xs
        sm:text-sm
        font-bold
      `
      : `
        px-3
        py-2
        border
        rounded-lg
        min-h-[36px]
        bg-white
        dark:bg-gray-700
        focus:ring-2
        ${
          error
            ? "border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400"
            : "border-gray-300 dark:border-gray-600 focus:ring-gray-400 dark:focus:ring-gray-500"
        }
      `
  }

  ${className}
`}
            {...props}
          >
            {/* Selected Value */}
            <span className="truncate text-left flex-1 w-full">
              {selectedOption?.label || placeholder}
            </span>

            {/* Chevron */}
            <ChevronDown
              size={16}
              className={`
    select-input-chevron
    flex-shrink-0
    transition-transform
    duration-200
    ${isOpen ? "rotate-180" : ""}
  `}
            />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div
              role="listbox"
              style={{
                position: "fixed",
                top:
                  wrapperRef.current?.getBoundingClientRect().bottom! + 4,
                left:
                  wrapperRef.current?.getBoundingClientRect().left!,
                width:
                  wrapperRef.current?.getBoundingClientRect().width!,
              }}
              className={`
      z-[9999]
      overflow-y-auto
      rounded-lg
      border
      border-gray-200
      dark:border-gray-600
      bg-white
      dark:bg-gray-700
      shadow-lg
      ${listMaxHeightClass}
    `}
            >
              {finalOptions.length > 0 ? (
                finalOptions.map((option) => {
                  const isSelected =
                    String(option.value) === String(value);

                  return (
                    <div
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        if (!option.disabled) {
                          handleSelect(option.value);
                        }
                      }}
                      className={`
                        px-3
                        py-2
                        text-xs
                        cursor-pointer
                        transition-colors
                        duration-150

                        flex
                        items-center

                        ${option.disabled
                          ? `
                              opacity-50
                              cursor-not-allowed
                              text-gray-400
                              dark:text-gray-500
                            `
                          : `
                              hover:bg-gray-100
                              dark:hover:bg-gray-600
                            `
                        }

                        ${isSelected
                          ? `
                              bg-gray-100
                              dark:bg-gray-600
                              text-gray-900
                              dark:text-white
                              font-medium
                            `
                          : `
                              text-gray-700
                              dark:text-gray-200
                            `
                        }
                      `}
                    >
                      <span className="truncate">
                        {option.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                  No options available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">
            {error}
          </p>
        )}
      </div>
    );
  }
);

SelectInput.displayName = "SelectInput";

export default SelectInput;