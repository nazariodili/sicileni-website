#  Framer Developers: Property Controls
          Framer Developers: Property Controls                                 

[](../)

[Log in](https://framer.com/r/login)

[Sign up](https://www.framer.com/r/signup/)

Copy

Logo as SVG

[

Brand

Guidelines





](../brand)

Product

Teams

Resources

Community

Support

[Enterprise](../enterprise/)

[Pricing](../pricing)

[](../)

Search...

Get Started

[Overview](./)

[Compare](./comparison)

[FAQ](./faq)

[Plugins](../)

[Introduction](./plugins-introduction)

[Quick Start](./plugins-quick-start)

[Publishing](./publishing)

[Changelog](./changelog)

[Reference](./reference)

Guides

Server API

[Introduction](./server-api-introduction)

[Quick Start](./server-api-quick-start)

[Reference](./server-api-reference)

[FAQ](./server-api-faq)

Fetch

[Introduction](./fetch-introduction)

[Examples](./fetch-examples)

Components

[Introduction](./components-introduction)

[Examples](./component-examples)

[Asset Sharing](./component-sharing)

[Auto-Sizing](./auto-sizing)

[Property Controls](./property-controls)

[Reference](./components-reference)

Overrides

[Introduction](./overrides-introduction)

[Examples](./overrides-examples)

[Developers](./)

![icon entry point for Site Search](https://framerusercontent.com/images/X8K2iCW5Tob8sQuioDPe6TJEU.png?width=40&height=40)

###### Search

Search...

Get Started

[Overview](./)

[Compare](./comparison)

[FAQ](./faq)

[Plugins](../)

[Introduction](./plugins-introduction)

[Quick Start](./plugins-quick-start)

[Publishing](./publishing)

[Changelog](./changelog)

[Reference](./reference)

Guides

Server API

[Introduction](./server-api-introduction)

[Quick Start](./server-api-quick-start)

[Reference](./server-api-reference)

[FAQ](./server-api-faq)

Fetch

[Introduction](./fetch-introduction)

[Examples](./fetch-examples)

Components

[Introduction](./components-introduction)

[Examples](./component-examples)

[Asset Sharing](./component-sharing)

[Auto-Sizing](./auto-sizing)

[Property Controls](./property-controls)

[Reference](./components-reference)

Overrides

[Introduction](./overrides-introduction)

[Examples](./overrides-examples)

[Property Controls](#property-controls)
=======================================

Property Controls allow users to pass properties (or props) to a code component through the Framer interface. When a user selects a code component on the canvas, its Property Controls are visible on the properties panel. As a component author, it’s up to you to decide which Property Controls to add and what options they should present to the user.

### [Adding Controls](#adding-controls)

To give your component Property Controls, import both the `addPropertyControls` function and the `ControlType` type from the `framer` library.

Below your component, call the `addPropertyControls` function with two arguments: first, the name of your component; and second, an object that defines controls for different properties. You have several types of controls to choose from, each of which are documented on this page.

Property Controls only affect components on the canvas. For this reason, you'll still want to use `defaultProps` for your component’s props, both to prevent errors as you code the component and when a designer creates an instance of your component from code.

In this example, we’re adding a Property Control for our component’s `text` prop. On the canvas, selecting the component will now display a control that allows us to set this property.

```
import { addPropertyControls, ControlType } from "framer"

export function MyComponent(props) {
  return <div>{props.text}</div>
}

MyComponent.defaultProps = {
  text: "Hello World!",
}

addPropertyControls(MyComponent, {
  text: { type: ControlType.String, title: "Hello World" },
})
```


```
import { addPropertyControls, ControlType } from "framer"

export function MyComponent(props) {
  return <div>{props.text}</div>
}

MyComponent.defaultProps = {
  text: "Hello World!",
}

addPropertyControls(MyComponent, {
  text: { type: ControlType.String, title: "Hello World" },
})
```


```
import { addPropertyControls, ControlType } from "framer"

export function MyComponent(props) {
  return <div>{props.text}</div>
}

MyComponent.defaultProps = {
  text: "Hello World!",
}

addPropertyControls(MyComponent, {
  text: { type: ControlType.String, title: "Hello World" },
})
```


### [Hiding Controls](#hiding-controls)

Controls can be hidden by adding the `hidden` function to the property description. The function receives an object containing the set properties and returns a `boolean`. In this example, we hide the `text` property entirely when the connected property (the `toggle`) is `false`. Now you can toggle the visibility of the text property control by changing the `toggle` boolean from within the property panel in Framer.

```
export function MyComponent(props) {
  return <div>{props.text}</div>
}

MyComponent.defaultProps = {
  text: "Hello World!",
  toggle: true,
}

addPropertyControls(MyComponent, {
  toggle: {
    type: ControlType.Boolean,
    title: "Toggle",
    enabledTitle: "Show",
    disabledTitle: "Hide",
  },
  text: {
    type: ControlType.String,
    title: "Text",
    hidden(props) {
      return props.toggle === false
    },
  },
})


```


```
export function MyComponent(props) {
  return <div>{props.text}</div>
}

MyComponent.defaultProps = {
  text: "Hello World!",
  toggle: true,
}

addPropertyControls(MyComponent, {
  toggle: {
    type: ControlType.Boolean,
    title: "Toggle",
    enabledTitle: "Show",
    disabledTitle: "Hide",
  },
  text: {
    type: ControlType.String,
    title: "Text",
    hidden(props) {
      return props.toggle === false
    },
  },
})


```


```
export function MyComponent(props) {
  return <div>{props.text}</div>
}

MyComponent.defaultProps = {
  text: "Hello World!",
  toggle: true,
}

addPropertyControls(MyComponent, {
  toggle: {
    type: ControlType.Boolean,
    title: "Toggle",
    enabledTitle: "Show",
    disabledTitle: "Hide",
  },
  text: {
    type: ControlType.String,
    title: "Text",
    hidden(props) {
      return props.toggle === false
    },
  },
})


```


### [Adding Descriptions](#adding-descriptions)

Controls can have a `description` property to add documentation about the control in the Framer UI—it appears in the Properties panel just above the control. It also supports adding emphasis and links using Markdown syntax. To add line breaks, use the newline character “`\n`”.

```
export function MyComponent(props) {
  return <div>{props.text}</div>
}

MyComponent.defaultProps = {
  text: "Hello World!",
  toggle: true,
}

addPropertyControls(MyComponent, {
  toggle: {
    type: ControlType.Boolean,
    title: "Toggle",
    description: "*On* by default",
  },
  text: {
    type: ControlType.String,
    title: "Text",
    description: "[Need inspiration?](https://www.lipsum.com)",
  },
})
```


```
export function MyComponent(props) {
  return <div>{props.text}</div>
}

MyComponent.defaultProps = {
  text: "Hello World!",
  toggle: true,
}

addPropertyControls(MyComponent, {
  toggle: {
    type: ControlType.Boolean,
    title: "Toggle",
    description: "*On* by default",
  },
  text: {
    type: ControlType.String,
    title: "Text",
    description: "[Need inspiration?](https://www.lipsum.com)",
  },
})
```


```
export function MyComponent(props) {
  return <div>{props.text}</div>
}

MyComponent.defaultProps = {
  text: "Hello World!",
  toggle: true,
}

addPropertyControls(MyComponent, {
  toggle: {
    type: ControlType.Boolean,
    title: "Toggle",
    description: "*On* by default",
  },
  text: {
    type: ControlType.String,
    title: "Text",
    description: "[Need inspiration?](https://www.lipsum.com)",
  },
})
```


### [Controls](#controls)

#### [Array `ControlType.Array`](#array-controltype.array)

A control that allows multiple values per `ControlType`, provided as an array via properties. For most control types this will be displayed as an additional section in the properties panel allowing as many fields to be provided as required.

For a `ControlType.ComponentInstance`, the component will also gain an additional outlet control on the Canvas that allows links to be created between frames.

Group properties together by using an object control.

```
export function MyComponent(props) {
  const frames = props.images.map(image => {
    return <img src={image?.src} alt={image?.alt} style={{ width: 50, height: 50 }} />
  })
  
  return <div style={{ display: "flex", gap: 10 }}>{frames}</div>
}

// Add a repeatable image property control
addPropertyControls(MyComponent, {
  images: {
    type: ControlType.Array,
    control: {
      type: ControlType.ResponsiveImage
    },
    // Allow up to five items
    maxCount: 5,
  },
})

// Add a multi-connector to your component to connect components on the canvas
addPropertyControls(MyComponent, {
  children: {
    type: ControlType.Array,
    control: {
      type: ControlType.ComponentInstance
    },
    maxCount: 5,
  },
})

// Add a list of objects
addPropertyControls(MyComponent, {
  myArray: {
    type: ControlType.Array,
    control: {
      type: ControlType.Object,
      controls: {
        title: { type: ControlType.String, defaultValue: "Employee" },
        avatar: { type: ControlType.ResponsiveImage },
      },
    },
    defaultValue: [
      { title: "Jorn" },
      { title: "Koen" },
    ],
  },
})

// For multiple values, you can pass in an array of single values as the React default prop.
MyComponent.defaultProps = {
   paddings: [5, 10, 15],
}
```


```
export function MyComponent(props) {
  const frames = props.images.map(image => {
    return <img src={image?.src} alt={image?.alt} style={{ width: 50, height: 50 }} />
  })
  
  return <div style={{ display: "flex", gap: 10 }}>{frames}</div>
}

// Add a repeatable image property control
addPropertyControls(MyComponent, {
  images: {
    type: ControlType.Array,
    control: {
      type: ControlType.ResponsiveImage
    },
    // Allow up to five items
    maxCount: 5,
  },
})

// Add a multi-connector to your component to connect components on the canvas
addPropertyControls(MyComponent, {
  children: {
    type: ControlType.Array,
    control: {
      type: ControlType.ComponentInstance
    },
    maxCount: 5,
  },
})

// Add a list of objects
addPropertyControls(MyComponent, {
  myArray: {
    type: ControlType.Array,
    control: {
      type: ControlType.Object,
      controls: {
        title: { type: ControlType.String, defaultValue: "Employee" },
        avatar: { type: ControlType.ResponsiveImage },
      },
    },
    defaultValue: [
      { title: "Jorn" },
      { title: "Koen" },
    ],
  },
})

// For multiple values, you can pass in an array of single values as the React default prop.
MyComponent.defaultProps = {
   paddings: [5, 10, 15],
}
```


```
export function MyComponent(props) {
  const frames = props.images.map(image => {
    return <img src={image?.src} alt={image?.alt} style={{ width: 50, height: 50 }} />
  })
  
  return <div style={{ display: "flex", gap: 10 }}>{frames}</div>
}

// Add a repeatable image property control
addPropertyControls(MyComponent, {
  images: {
    type: ControlType.Array,
    control: {
      type: ControlType.ResponsiveImage
    },
    // Allow up to five items
    maxCount: 5,
  },
})

// Add a multi-connector to your component to connect components on the canvas
addPropertyControls(MyComponent, {
  children: {
    type: ControlType.Array,
    control: {
      type: ControlType.ComponentInstance
    },
    maxCount: 5,
  },
})

// Add a list of objects
addPropertyControls(MyComponent, {
  myArray: {
    type: ControlType.Array,
    control: {
      type: ControlType.Object,
      controls: {
        title: { type: ControlType.String, defaultValue: "Employee" },
        avatar: { type: ControlType.ResponsiveImage },
      },
    },
    defaultValue: [
      { title: "Jorn" },
      { title: "Koen" },
    ],
  },
})

// For multiple values, you can pass in an array of single values as the React default prop.
MyComponent.defaultProps = {
   paddings: [5, 10, 15],
}
```


#### [Boolean `ControlType.Boolean`](#boolean-controltype.boolean)

A control that displays an on / off checkbox. The associated property will be `true` or `false` , depending on the state of the checkbox. Includes an optional `defaultValue`, which is set to `true` by default.

```
export function MyComponent(props) {
    return (
        <div style={{ minHeight: 50, minWidth: 50 }}>
            {props.showText ? "Hello World" : null}
        </div>
    )
}

addPropertyControls(MyComponent, {
  showText: {
    type: ControlType.Boolean,
    title: "Show Text",
    defaultValue: true,
  },
})
```


```
export function MyComponent(props) {
    return (
        <div style={{ minHeight: 50, minWidth: 50 }}>
            {props.showText ? "Hello World" : null}
        </div>
    )
}

addPropertyControls(MyComponent, {
  showText: {
    type: ControlType.Boolean,
    title: "Show Text",
    defaultValue: true,
  },
})
```


```
export function MyComponent(props) {
    return (
        <div style={{ minHeight: 50, minWidth: 50 }}>
            {props.showText ? "Hello World" : null}
        </div>
    )
}

addPropertyControls(MyComponent, {
  showText: {
    type: ControlType.Boolean,
    title: "Show Text",
    defaultValue: true,
  },
})
```


#### [Color `ControlType.Color`](#color-controltype.color)

A control that represents a color value. It will be included in the component props as a string.

This control is displayed as a color field and will provide the selected color in either RGB (`rgb(255, 255, 255)`) or RGBA `(rgba(255, 255, 255, 0.5)` notation, depending on whether there is an alpha channel.

You can also make the color optional by adding the optional property.

```
export function MyComponent(props) {
  return (
    <div
      style={{
        backgroundColor: props.background,
        width: 50,
        height: 50,
      }}
    />
  )
}

addPropertyControls(MyComponent, {
  background: {
    type: ControlType.Color,
    defaultValue: "#fff",
    optional: true,
  },
})
```


```
export function MyComponent(props) {
  return (
    <div
      style={{
        backgroundColor: props.background,
        width: 50,
        height: 50,
      }}
    />
  )
}

addPropertyControls(MyComponent, {
  background: {
    type: ControlType.Color,
    defaultValue: "#fff",
    optional: true,
  },
})
```


```
export function MyComponent(props) {
  return (
    <div
      style={{
        backgroundColor: props.background,
        width: 50,
        height: 50,
      }}
    />
  )
}

addPropertyControls(MyComponent, {
  background: {
    type: ControlType.Color,
    defaultValue: "#fff",
    optional: true,
  },
})
```


#### [ComponentInstance `ControlType.ComponentInstance`](#componentinstance-controltype.componentinstance)

A control that references to another component on the canvas, included in the component props as a React node. The component will have an outlet to allow linking to other Frames. Available Frames will also be displayed in a dropdown menu in the properties panel. The component reference will be provided as a property. As a convention, the name for the property is usually just `children`.

Multiple components can be linked by combining the `ComponentInstance` type with the `[ControlType.Array](../#array-controltype-array)`.

```
export function MyComponent(props) {
  return <div>{props.children}</div>
}

addPropertyControls(MyComponent, {
  children: {
    type: ControlType.ComponentInstance,
  },
})
```


```
export function MyComponent(props) {
  return <div>{props.children}</div>
}

addPropertyControls(MyComponent, {
  children: {
    type: ControlType.ComponentInstance,
  },
})
```


```
export function MyComponent(props) {
  return <div>{props.children}</div>
}

addPropertyControls(MyComponent, {
  children: {
    type: ControlType.ComponentInstance,
  },
})
```


#### [Date `ControlType.Date`](#date-controltype.date)

A property control that represents a date. The value will be passed to the component as an ISO 8601 formatted string.

You can optionally enable a time picker by setting the `displayTime` boolean to `true`. When enabled, a time input appears below the date input, allowing the user to select a time value in addition to the date.

```
export function MyComponent(props) {
  return (
    <div>
      <div>Date: {props.date}</div>
      <div>Date & Time: {props.dateAndTime}</div>
    </div>
  )
}

addPropertyControls(MyComponent, {
  date: {
    type: ControlType.Date,
    title: "Date",
  },
  dateAndTime: {
    type: ControlType.Date,
    title: "Date & Time",
    displayTime: true,
  },
})
```


```
export function MyComponent(props) {
  return (
    <div>
      <div>Date: {props.date}</div>
      <div>Date & Time: {props.dateAndTime}</div>
    </div>
  )
}

addPropertyControls(MyComponent, {
  date: {
    type: ControlType.Date,
    title: "Date",
  },
  dateAndTime: {
    type: ControlType.Date,
    title: "Date & Time",
    displayTime: true,
  },
})
```


```
export function MyComponent(props) {
  return (
    <div>
      <div>Date: {props.date}</div>
      <div>Date & Time: {props.dateAndTime}</div>
    </div>
  )
}

addPropertyControls(MyComponent, {
  date: {
    type: ControlType.Date,
    title: "Date",
  },
  dateAndTime: {
    type: ControlType.Date,
    title: "Date & Time",
    displayTime: true,
  },
})
```


#### [Enum `ControlType.Enum`](#enum-controltype.enum)

A property control that represents a list of options. The list contains primitive values and each value has to be unique. The selected option will be provided as a property. This control is displayed as a dropdown menu in which a user can select one of the items. `displaySegmentedControl` can be enabled to display a segmented control instead.

**Note:** `ControlType.SegmentedEnum` is deprecated, please use `ControlType.Enum` and enable `displaySegmentedControl`.

```
export function MyComponent(props) {
  const value = props.value || "a"
  const colors = { a: "red", b: "green", c: "blue" }
  return (
    <div 
      style={{ 
        backgroundColor: colors[value], 
        width: 50, 
        height: 50 
      }}
    >
      {value}
    </div>
  )
}

addPropertyControls(MyComponent, {
  value: {
    type: ControlType.Enum,
    defaultValue: "a",
    displaySegmentedControl: true,
    segmentedControlDirection: "vertical",
    options: ["a", "b", "c"],
    optionTitles: ["Option A", "Option B", "Option C"]
  },
})
```


```
export function MyComponent(props) {
  const value = props.value || "a"
  const colors = { a: "red", b: "green", c: "blue" }
  return (
    <div 
      style={{ 
        backgroundColor: colors[value], 
        width: 50, 
        height: 50 
      }}
    >
      {value}
    </div>
  )
}

addPropertyControls(MyComponent, {
  value: {
    type: ControlType.Enum,
    defaultValue: "a",
    displaySegmentedControl: true,
    segmentedControlDirection: "vertical",
    options: ["a", "b", "c"],
    optionTitles: ["Option A", "Option B", "Option C"]
  },
})
```


```
export function MyComponent(props) {
  const value = props.value || "a"
  const colors = { a: "red", b: "green", c: "blue" }
  return (
    <div 
      style={{ 
        backgroundColor: colors[value], 
        width: 50, 
        height: 50 
      }}
    >
      {value}
    </div>
  )
}

addPropertyControls(MyComponent, {
  value: {
    type: ControlType.Enum,
    defaultValue: "a",
    displaySegmentedControl: true,
    segmentedControlDirection: "vertical",
    options: ["a", "b", "c"],
    optionTitles: ["Option A", "Option B", "Option C"]
  },
})
```


#### [EventHandler `ControlType.EventHandler`](#eventhandler-controltype.eventhandler)

A control that exposes events in the Interactions section of the Properties Panel when used within Smart Components.When selection Interactions such as “New Transition”, you can select which event to listen to.

```
export function MyComponent(props) {
  return <motion.div onTap={props.onTap} style={{ width: 50, height: 50 }} />
}

addPropertyControls(MyComponent, {
  onTap: {
    type: ControlType.EventHandler,
  },
})
```


```
export function MyComponent(props) {
  return <motion.div onTap={props.onTap} style={{ width: 50, height: 50 }} />
}

addPropertyControls(MyComponent, {
  onTap: {
    type: ControlType.EventHandler,
  },
})
```


```
export function MyComponent(props) {
  return <motion.div onTap={props.onTap} style={{ width: 50, height: 50 }} />
}

addPropertyControls(MyComponent, {
  onTap: {
    type: ControlType.EventHandler,
  },
})
```


#### [File `ControlType.File`](#file-controltype.file)

A control that allows the user to pick a file resource. It will be included in the component props as a URL string. Displayed as a file picker that will open a native file browser. The selected file will be provided as a fully qualified URL. The `allowedFileTypes` property must be provided to specify acceptable file types.

```
export function MyComponent(props) {
  return (
      <video
        style={{ objectFit: "contain", ...props.style }}
        src={props.filepath}
        controls
      />
  )
}

addPropertyControls(MyComponent, {
  filepath: {
    type: ControlType.File,
    allowedFileTypes: ["mov"],
  },
})
```


```
export function MyComponent(props) {
  return (
      <video
        style={{ objectFit: "contain", ...props.style }}
        src={props.filepath}
        controls
      />
  )
}

addPropertyControls(MyComponent, {
  filepath: {
    type: ControlType.File,
    allowedFileTypes: ["mov"],
  },
})
```


```
export function MyComponent(props) {
  return (
      <video
        style={{ objectFit: "contain", ...props.style }}
        src={props.filepath}
        controls
      />
  )
}

addPropertyControls(MyComponent, {
  filepath: {
    type: ControlType.File,
    allowedFileTypes: ["mov"],
  },
})
```


#### [ResponsiveImage `ControlType.ResponsiveImage`](#responsiveimage-controltype.responsiveimage)

A control that allows the user to pick an image resource. Displayed as an image picker with associated file picker.

The chosen image will be provided in the component props as an object with `src` and `srcSet` properties:

*   `src`: a string containing the URL of a full resolution image
    
*   `srcSet`: an optional string with scaled down image variants. This is typically passed into `[<img srcSet />](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/srcset)` and helps the browser to load a smaller image when a full-size one isn’t necessary.
    
*   `alt`: an optional description of the image.
    

**Note:** `ControlType.Image` is deprecated, please use `ControlType.ResponsiveImage`

```
export function MyComponent(props) {
  return (
      <img 
        src={props.image.src}
        srcSet={props.image.srcSet}
        alt={props.image.alt}
      />
  )
}
     
addPropertyControls(MyComponent, {
  image: {
    type: ControlType.ResponsiveImage,
  }
})
```


```
export function MyComponent(props) {
  return (
      <img 
        src={props.image.src}
        srcSet={props.image.srcSet}
        alt={props.image.alt}
      />
  )
}
     
addPropertyControls(MyComponent, {
  image: {
    type: ControlType.ResponsiveImage,
  }
})
```


```
export function MyComponent(props) {
  return (
      <img 
        src={props.image.src}
        srcSet={props.image.srcSet}
        alt={props.image.alt}
      />
  )
}
     
addPropertyControls(MyComponent, {
  image: {
    type: ControlType.ResponsiveImage,
  }
})
```


#### [Number `ControlType.Number`](#number-controltype.number)

A control that accepts any numeric value. This will be provided directly as a property. Will display an input field with a range slider by default. The `displayStepper` option can be enabled to include a stepper control instead.

```
import { motion } from "framer-motion"

export function MyComponent(props) {
    return (
        <motion.div rotateZ={props.rotation} style={{ width: 50, height: 50 }}>
            {props.rotation}
        </motion.div>
    )
}

addPropertyControls(MyComponent, {
  rotation: {
    type: ControlType.Number,
    defaultValue: 0,
    min: 0,
    max: 360,
    unit: "deg",
    step: 0.1,
    displayStepper: true,
  },
})
```


```
import { motion } from "framer-motion"

export function MyComponent(props) {
    return (
        <motion.div rotateZ={props.rotation} style={{ width: 50, height: 50 }}>
            {props.rotation}
        </motion.div>
    )
}

addPropertyControls(MyComponent, {
  rotation: {
    type: ControlType.Number,
    defaultValue: 0,
    min: 0,
    max: 360,
    unit: "deg",
    step: 0.1,
    displayStepper: true,
  },
})
```


```
import { motion } from "framer-motion"

export function MyComponent(props) {
    return (
        <motion.div rotateZ={props.rotation} style={{ width: 50, height: 50 }}>
            {props.rotation}
        </motion.div>
    )
}

addPropertyControls(MyComponent, {
  rotation: {
    type: ControlType.Number,
    defaultValue: 0,
    min: 0,
    max: 360,
    unit: "deg",
    step: 0.1,
    displayStepper: true,
  },
})
```


#### [Object `ControlType.Object`](#object-controltype.object)

A control that allows for grouping multiple properties as an object.

You can make the object removable by adding the optional property. To replace the default button title, use the `buttonTitle` property. To change the default icon, use the `icon` property.

```
export function MyComponent(props) {
  return (
    <div 
      style={{ 
        opacity: props.myObject.opacity,
        backgroundColor: props.myObject.tint
      }} 
    />
  )
}

addPropertyControls(MyComponent, {
  myObject: {
    type: ControlType.Object,
    optional: true,
    buttonTitle: "Style",
    icon: "color", // boolean, object, color, effect or interact
    controls: {
      opacity: { type: ControlType.Number },
      tint: { type: ControlType.Color },
    }
  }
})
```


```
export function MyComponent(props) {
  return (
    <div 
      style={{ 
        opacity: props.myObject.opacity,
        backgroundColor: props.myObject.tint
      }} 
    />
  )
}

addPropertyControls(MyComponent, {
  myObject: {
    type: ControlType.Object,
    optional: true,
    buttonTitle: "Style",
    icon: "color", // boolean, object, color, effect or interact
    controls: {
      opacity: { type: ControlType.Number },
      tint: { type: ControlType.Color },
    }
  }
})
```


```
export function MyComponent(props) {
  return (
    <div 
      style={{ 
        opacity: props.myObject.opacity,
        backgroundColor: props.myObject.tint
      }} 
    />
  )
}

addPropertyControls(MyComponent, {
  myObject: {
    type: ControlType.Object,
    optional: true,
    buttonTitle: "Style",
    icon: "color", // boolean, object, color, effect or interact
    controls: {
      opacity: { type: ControlType.Number },
      tint: { type: ControlType.Color },
    }
  }
})
```


#### [String `ControlType.String`](#string-controltype.string)

A control that accepts plain text values. This will be provided directly as a property. Will display an input field with an optional placeholder value.

If `obscured` attribute is set to true a password input field will be used instead of a regular text input so that the value in the input will be visually obscured, yet still be available as plain text inside the component. `displayTextArea` can be enabled to display a multi-line input area instead. `maxLength` can be set to limit the maximum number of characters that can be entered in the input field.

```
export function MyComponent(props) {
  return <div>{props.title} — {props.body}</div>
}

addPropertyControls(MyComponent, {
  title: {
    type: ControlType.String,
    defaultValue: "Framer",
    placeholder: "Type something…",
    maxLength: 50
  },
  body: {
    type: ControlType.String,
    defaultValue: "Lorem ipsum dolor sit amet.",
    placeholder: "Type something…",
    displayTextArea: true,
  },
})
```


```
export function MyComponent(props) {
  return <div>{props.title} — {props.body}</div>
}

addPropertyControls(MyComponent, {
  title: {
    type: ControlType.String,
    defaultValue: "Framer",
    placeholder: "Type something…",
    maxLength: 50
  },
  body: {
    type: ControlType.String,
    defaultValue: "Lorem ipsum dolor sit amet.",
    placeholder: "Type something…",
    displayTextArea: true,
  },
})
```


```
export function MyComponent(props) {
  return <div>{props.title} — {props.body}</div>
}

addPropertyControls(MyComponent, {
  title: {
    type: ControlType.String,
    defaultValue: "Framer",
    placeholder: "Type something…",
    maxLength: 50
  },
  body: {
    type: ControlType.String,
    defaultValue: "Lorem ipsum dolor sit amet.",
    placeholder: "Type something…",
    displayTextArea: true,
  },
})
```


#### [Transition `ControlType.Transition`](#transition-controltype.transition)

A control that allows for editing Framer Motion transition options within the Framer UI.

```
export function MyComponent(props) {
  return (
      <motion.div
         animate={{ scale: 2 }}
         transition={props.transition}
      />
  )
}

addPropertyControls(MyComponent, {
  transition: {
    type: ControlType.Transition,
    defaultValue: { type: "spring", stiffness: 800, damping: 60 },
  },
})
```


```
export function MyComponent(props) {
  return (
      <motion.div
         animate={{ scale: 2 }}
         transition={props.transition}
      />
  )
}

addPropertyControls(MyComponent, {
  transition: {
    type: ControlType.Transition,
    defaultValue: { type: "spring", stiffness: 800, damping: 60 },
  },
})
```


```
export function MyComponent(props) {
  return (
      <motion.div
         animate={{ scale: 2 }}
         transition={props.transition}
      />
  )
}

addPropertyControls(MyComponent, {
  transition: {
    type: ControlType.Transition,
    defaultValue: { type: "spring", stiffness: 800, damping: 60 },
  },
})
```


#### [Link `ControlType.Link`](#link-controltype.link)

A control that allows for exposing web links.

```
export function MyComponent(props) {
  return <a href={props.link}>My Link</a>
}

addPropertyControls(MyComponent, {
  link: {
    type: ControlType.Link,
    defaultValue: "https://www.framer.com"
  }
})
```


```
export function MyComponent(props) {
  return <a href={props.link}>My Link</a>
}

addPropertyControls(MyComponent, {
  link: {
    type: ControlType.Link,
    defaultValue: "https://www.framer.com"
  }
})
```


```
export function MyComponent(props) {
  return <a href={props.link}>My Link</a>
}

addPropertyControls(MyComponent, {
  link: {
    type: ControlType.Link,
    defaultValue: "https://www.framer.com"
  }
})
```


#### [Padding `ControlType.Padding`](#padding-controltype.padding)

A control that represents CSS padding. Will display an input field to accept a single value, alongside a segmented control allowing four distinct values to be provided.

Includes an optional `defaultValue` that can be set with single value (e.g. `"10px"` or `"10px 20px 30px 40px"`).

**Note:** `FusedNumber` is deprecated, please use `[ControlType.Padding](../#padding-controltype-padding)` and `[ControlType.BorderRadius](../#borderradius-controltype-borderradius)`

```
export function MyComponent({ padding }) {
  return <div style={{ padding }} />
}
     
addPropertyControls(MyComponent, {
  padding: {
    type: ControlType.Padding,
    defaultValue: "8px",
  }
})
```


```
export function MyComponent({ padding }) {
  return <div style={{ padding }} />
}
     
addPropertyControls(MyComponent, {
  padding: {
    type: ControlType.Padding,
    defaultValue: "8px",
  }
})
```


```
export function MyComponent({ padding }) {
  return <div style={{ padding }} />
}
     
addPropertyControls(MyComponent, {
  padding: {
    type: ControlType.Padding,
    defaultValue: "8px",
  }
})
```


#### [BorderRadius `ControlType.BorderRadius`](#borderradius-controltype.borderradius)

A control that represents CSS border radius. Will display an input field to accept a single value, alongside a segmented control allowing four distinct values to be provided.

Includes an optional `defaultValue` that can be set with single value (e.g. `"10px"` or `"10px 20px 30px 40px"`).

**Note:** `FusedNumber` is deprecated, please use `[ControlType.Padding](../#padding-controltype-padding)` and `[ControlType.BorderRadius](../#borderradius-controltype-borderradius)`

```
export function MyComponent({ borderRadius }) {
  return <div style={{ borderRadius }} />
}
     
addPropertyControls(MyComponent, {
  borderRadius: {
    type: ControlType.BorderRadius,
    defaultValue: "16px",
    title: "Radius",
  }
})
```


```
export function MyComponent({ borderRadius }) {
  return <div style={{ borderRadius }} />
}
     
addPropertyControls(MyComponent, {
  borderRadius: {
    type: ControlType.BorderRadius,
    defaultValue: "16px",
    title: "Radius",
  }
})
```


```
export function MyComponent({ borderRadius }) {
  return <div style={{ borderRadius }} />
}
     
addPropertyControls(MyComponent, {
  borderRadius: {
    type: ControlType.BorderRadius,
    defaultValue: "16px",
    title: "Radius",
  }
})
```


#### [Border `ControlType.Border`](#border-controltype.border)

A control that represents a border style. Either `borderWidth` or the equivalent per-side values (e.g `borderTopWidth`, `borderLeftWidth`, `borderRightWidth`, `borderBottomWidth`) will be provided.

```
export function MyComponent(props) {
  return <div style={props.border} />
}

addPropertyControls(MyComponent, {
  border: {
    type: ControlType.Border,
    defaultValue: {
      borderWidth: 1,
      borderStyle: "solid", // solid, dashed, dotted or double
      borderColor: "rgba(0, 0, 0, 0.5)",
    },
  }
})
```


```
export function MyComponent(props) {
  return <div style={props.border} />
}

addPropertyControls(MyComponent, {
  border: {
    type: ControlType.Border,
    defaultValue: {
      borderWidth: 1,
      borderStyle: "solid", // solid, dashed, dotted or double
      borderColor: "rgba(0, 0, 0, 0.5)",
    },
  }
})
```


```
export function MyComponent(props) {
  return <div style={props.border} />
}

addPropertyControls(MyComponent, {
  border: {
    type: ControlType.Border,
    defaultValue: {
      borderWidth: 1,
      borderStyle: "solid", // solid, dashed, dotted or double
      borderColor: "rgba(0, 0, 0, 0.5)",
    },
  }
})
```


You can also set the default value for each side.

```
export function MyComponent(props) {
  return <div style={props.border} />
}

addPropertyControls(MyComponent, {
  border: {
    type: ControlType.Border,
    defaultValue: {
      borderTopWidth: 2,
      borderRightWidth: 1,
      borderBottomWidth: 2,
      borderLeftWidth: 1,
      borderStyle: "solid", // solid, dashed, dotted or double
      borderColor: "rgba(0, 0, 0, 0.5)",
    },
  }
})
```


```
export function MyComponent(props) {
  return <div style={props.border} />
}

addPropertyControls(MyComponent, {
  border: {
    type: ControlType.Border,
    defaultValue: {
      borderTopWidth: 2,
      borderRightWidth: 1,
      borderBottomWidth: 2,
      borderLeftWidth: 1,
      borderStyle: "solid", // solid, dashed, dotted or double
      borderColor: "rgba(0, 0, 0, 0.5)",
    },
  }
})
```


```
export function MyComponent(props) {
  return <div style={props.border} />
}

addPropertyControls(MyComponent, {
  border: {
    type: ControlType.Border,
    defaultValue: {
      borderTopWidth: 2,
      borderRightWidth: 1,
      borderBottomWidth: 2,
      borderLeftWidth: 1,
      borderStyle: "solid", // solid, dashed, dotted or double
      borderColor: "rgba(0, 0, 0, 0.5)",
    },
  }
})
```


#### [BoxShadow `ControlType.BoxShadow`](#boxshadow-controltype.boxshadow)

A control that allows for exposing shadows. The value will be provided as a string with valid CSS box-shadow values.

```
export function MyComponent(props) {
  return <motion.div style={{boxShadow: props.shadow}} />
}

addPropertyControls(MyComponent, {
  shadow: {
    type: ControlType.BoxShadow,
    defaultValue: "0px 1px 2px 0px rgba(0,0,0,0.25)",
  }
})
```


```
export function MyComponent(props) {
  return <motion.div style={{boxShadow: props.shadow}} />
}

addPropertyControls(MyComponent, {
  shadow: {
    type: ControlType.BoxShadow,
    defaultValue: "0px 1px 2px 0px rgba(0,0,0,0.25)",
  }
})
```


```
export function MyComponent(props) {
  return <motion.div style={{boxShadow: props.shadow}} />
}

addPropertyControls(MyComponent, {
  shadow: {
    type: ControlType.BoxShadow,
    defaultValue: "0px 1px 2px 0px rgba(0,0,0,0.25)",
  }
})
```


#### [Gap `ControlType.Gap`](#gap-controltype.gap)

A control that represents a two-dimensional gap value. It is displayed as two number inputs side by side, labeled **X** and **Y**.

The value is provided to the component as a CSS-compatible string in the format: `"X Y"`. For example: `"8px 16px"`

*   **Y** (vertical gap) is the first value
    
*   **X** (horizontal gap) is the second value
    
*   Both values have a minimum of `0`
    
*   Commonly used for layout gaps such as grid or flex spacing
    

```
export function MyComponent({ gap }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap,
      }}
    >
      <div>A</div>
      <div>B</div>
      <div>C</div>
    </div>
  )
}

addPropertyControls(MyComponent, {
  gap: {
    type: ControlType.Gap,
    defaultValue: "0px 0px",
  },
})
```


```
export function MyComponent({ gap }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap,
      }}
    >
      <div>A</div>
      <div>B</div>
      <div>C</div>
    </div>
  )
}

addPropertyControls(MyComponent, {
  gap: {
    type: ControlType.Gap,
    defaultValue: "0px 0px",
  },
})
```


```
export function MyComponent({ gap }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap,
      }}
    >
      <div>A</div>
      <div>B</div>
      <div>C</div>
    </div>
  )
}

addPropertyControls(MyComponent, {
  gap: {
    type: ControlType.Gap,
    defaultValue: "0px 0px",
  },
})
```


#### [Font `ControlType.Font`](#font-controltype.font)

A control that allows for selecting a font to be used in the component.

```
export function MyComponent(props) {
  return <div style={props.customFont} />;
}

addPropertyControls(MyComponent, {
  customFont: {
    type: ControlType.Font,
    title: "Custom Font",
    defaultValue: {
      textAlign: "left", // or "right", or "center", or "justify"
      fontSize: 16, // or "16px", or "16rem"
      letterSpacing: 0.1, // or "0.1em", or "1px"
      lineHeight: 1.5, // or "1.5em", or "20px", or "150%"
      /**
       * The `variant` property in `defaultValue` is only available when `defaultFontType` is set to
       * `"sans-serif"`.
       *
       * Available variant options:
       * - Regular weights: `"Regular"`, `"Thin"`, `"Extra Light"`, `"Light"`, `"Medium"`,
       *   `"Semibold"`, `"Bold"`, `"Extra Bold"`, `"Black"`
       * - Italic styles: `"Italic"`, `"Thin Italic"`, `"Extra Light Italic"`, `"Light Italic"`,
       *   `"Medium Italic"`, `"Semibold Italic"`, `"Bold Italic"`, `"Extra Bold Italic"`,
       *   `"Black Italic"`, `"Regular Italic"`
       * - Variable fonts: `"Variable"`, `"Variable Italic"`
       */
      variant: "Semibold",
    },
    defaultFontType: "sans-serif", // or "serif", or "monospace"
    defaultFontSize: "16px", // or "16rem", or "16pt"
    displayTextAlignment: true,
    displayFontSize: true,
    controls: "basic", // or "extended", to show more options
  },
});
```


```
export function MyComponent(props) {
  return <div style={props.customFont} />;
}

addPropertyControls(MyComponent, {
  customFont: {
    type: ControlType.Font,
    title: "Custom Font",
    defaultValue: {
      textAlign: "left", // or "right", or "center", or "justify"
      fontSize: 16, // or "16px", or "16rem"
      letterSpacing: 0.1, // or "0.1em", or "1px"
      lineHeight: 1.5, // or "1.5em", or "20px", or "150%"
      /**
       * The `variant` property in `defaultValue` is only available when `defaultFontType` is set to
       * `"sans-serif"`.
       *
       * Available variant options:
       * - Regular weights: `"Regular"`, `"Thin"`, `"Extra Light"`, `"Light"`, `"Medium"`,
       *   `"Semibold"`, `"Bold"`, `"Extra Bold"`, `"Black"`
       * - Italic styles: `"Italic"`, `"Thin Italic"`, `"Extra Light Italic"`, `"Light Italic"`,
       *   `"Medium Italic"`, `"Semibold Italic"`, `"Bold Italic"`, `"Extra Bold Italic"`,
       *   `"Black Italic"`, `"Regular Italic"`
       * - Variable fonts: `"Variable"`, `"Variable Italic"`
       */
      variant: "Semibold",
    },
    defaultFontType: "sans-serif", // or "serif", or "monospace"
    defaultFontSize: "16px", // or "16rem", or "16pt"
    displayTextAlignment: true,
    displayFontSize: true,
    controls: "basic", // or "extended", to show more options
  },
});
```


```
export function MyComponent(props) {
  return <div style={props.customFont} />;
}

addPropertyControls(MyComponent, {
  customFont: {
    type: ControlType.Font,
    title: "Custom Font",
    defaultValue: {
      textAlign: "left", // or "right", or "center", or "justify"
      fontSize: 16, // or "16px", or "16rem"
      letterSpacing: 0.1, // or "0.1em", or "1px"
      lineHeight: 1.5, // or "1.5em", or "20px", or "150%"
      /**
       * The `variant` property in `defaultValue` is only available when `defaultFontType` is set to
       * `"sans-serif"`.
       *
       * Available variant options:
       * - Regular weights: `"Regular"`, `"Thin"`, `"Extra Light"`, `"Light"`, `"Medium"`,
       *   `"Semibold"`, `"Bold"`, `"Extra Bold"`, `"Black"`
       * - Italic styles: `"Italic"`, `"Thin Italic"`, `"Extra Light Italic"`, `"Light Italic"`,
       *   `"Medium Italic"`, `"Semibold Italic"`, `"Bold Italic"`, `"Extra Bold Italic"`,
       *   `"Black Italic"`, `"Regular Italic"`
       * - Variable fonts: `"Variable"`, `"Variable Italic"`
       */
      variant: "Semibold",
    },
    defaultFontType: "sans-serif", // or "serif", or "monospace"
    defaultFontSize: "16px", // or "16rem", or "16pt"
    displayTextAlignment: true,
    displayFontSize: true,
    controls: "basic", // or "extended", to show more options
  },
});
```


#### [Cursor `ControlType.Cursor`](#cursor-controltype.cursor)

A control that specifies which cursor appears when hovering over the element. Accepts standard CSS cursor values (e.g. `pointer`, `grab`, `not-allowed`).

  
**Note:** The `wait` value is excluded because it looks identical to `progress` on macOS.

```
export function MyComponent(props) {
  return <div style={{ cursor: props.cursor }}>Hover me!</div>
}

addPropertyControls(MyComponent, {
  cursor: {
    type: ControlType.Cursor,
    title: "Cursor",
    defaultValue: "pointer",
  },
})
```


```
export function MyComponent(props) {
  return <div style={{ cursor: props.cursor }}>Hover me!</div>
}

addPropertyControls(MyComponent, {
  cursor: {
    type: ControlType.Cursor,
    title: "Cursor",
    defaultValue: "pointer",
  },
})
```


```
export function MyComponent(props) {
  return <div style={{ cursor: props.cursor }}>Hover me!</div>
}

addPropertyControls(MyComponent, {
  cursor: {
    type: ControlType.Cursor,
    title: "Cursor",
    defaultValue: "pointer",
  },
})
```


### [TrackingId `ControlType.TrackingId`](#trackingid-controltype.trackingid)

A control for defining a tracking identifier used with Framer’s analytics system. The value is provided as a string and is intended to be passed to the `track()` function from the `useTracking()` hook to record custom events.

Tracking IDs must be **lowercase** and use **hyphens** to separate words (for example, `button-click`). IDs that don’t follow this format will not be tracked.

Use this control to expose analytics-friendly identifiers for custom interactions such as button clicks or component-specific events.

For more details on tracking custom events and viewing results in analytics, see: [**How to track custom events in Framer**](../help/articles/how-to-track-custom-events-in-framer/)

```
import { addPropertyControls, ControlType, useTracking } from "framer"

export function MyComponent({ trackingId }) {
  const track = useTracking()

  return (
    <button
      onClick={() => {
        if (trackingId) {
          track(trackingId)
        }
      }}
    >
      Track Event
    </button>
  )
}

addPropertyControls(MyComponent, {
  trackingId: {
    type: ControlType.TrackingId,
    title: "Tracking ID",
  },
})
```


```
import { addPropertyControls, ControlType, useTracking } from "framer"

export function MyComponent({ trackingId }) {
  const track = useTracking()

  return (
    <button
      onClick={() => {
        if (trackingId) {
          track(trackingId)
        }
      }}
    >
      Track Event
    </button>
  )
}

addPropertyControls(MyComponent, {
  trackingId: {
    type: ControlType.TrackingId,
    title: "Tracking ID",
  },
})
```


```
import { addPropertyControls, ControlType, useTracking } from "framer"

export function MyComponent({ trackingId }) {
  const track = useTracking()

  return (
    <button
      onClick={() => {
        if (trackingId) {
          track(trackingId)
        }
      }}
    >
      Track Event
    </button>
  )
}

addPropertyControls(MyComponent, {
  trackingId: {
    type: ControlType.TrackingId,
    title: "Tracking ID",
  },
})
```


[

### Previous

Auto-Sizing





](./auto-sizing)
[

### Next

Reference





](./components-reference)

Get an AI summary of Framer

[](https://chat.openai.com/?q=As%20a%20potential%20Framer%20customer%2C%20I%20want%20to%20clearly%20understand%20what%20I%20get%20when%20I%20use%20Framer%20and%20how%20it%20fits%20into%20my%20workflow.%0A%0AExplain%20the%20experience%20step%20by%20step%3A%20what%20I%20can%20create%2C%20what%20I%20control%2C%20what%20Framer%20handles%20for%20me%2C%20and%20how%20things%20evolve%20over%20time.%20Describe%20what%20I%20see%20in%20the%20editor%20and%20dashboard%2C%20how%20publishing%20works%2C%20how%20updates%20are%20managed%2C%20and%20what%20outputs%20I%20end%20up%20with%20\(sites%2C%20pages%2C%20components%2C%20analytics%2C%20performance%2C%20etc.\).%0A%0AClarify%20the%20key%20features%20and%20systems%20involved%E2%80%94design%20tools%2C%20CMS%2C%20components%2C%20interactions%2C%20hosting%2C%20performance%2C%20collaboration%2C%20and%20any%20metrics%20or%20insights%20Framer%20provides.%20Include%20how%20often%20things%20update%20\(e.g.%20content%20changes%2C%20deployments%2C%20analytics%20refresh\).%0A%0AExplain%20this%20simply%20and%20concretely%2C%20as%20if%20you%20were%20describing%20the%20real%2C%20day-to-day%20experience%20of%20building%20and%20running%20a%20website%20with%20Framer%20for%20the%20first%20time.)
[](https://www.google.com/search?udm=50&q=As%20a%20potential%20Framer%20customer%2C%20I%20want%20to%20clearly%20understand%20what%20I%20get%20when%20I%20use%20Framer%20and%20how%20it%20fits%20into%20my%20workflow.%0A%0AExplain%20the%20experience%20step%20by%20step%2C%20as%20if%20describing%20the%20real%2C%20day-to-day%20use%20of%20the%20product.%20Cover%20what%20I%20can%20create%2C%20what%20I%20control%2C%20what%20Framer%20handles%20automatically%2C%20and%20how%20things%20change%20over%20time.%0A%0ADescribe%20what%20I%20see%20in%20the%20editor%20and%20dashboard%2C%20how%20publishing%20works%2C%20how%20updates%20are%20made%2C%20and%20what%20the%20final%20outputs%20are%2C%20such%20as%20websites%2C%20pages%2C%20components%2C%20performance%2C%20and%20analytics.%0A%0AExplain%20this%20simply%20and%20concretely%2C%20focused%20on%20what%20a%20first-time%20user%20would%20actually%20experience.)
[](https://www.perplexity.ai/search?q=As%20a%20potential%20Framer%20customer%2C%20I%20want%20to%20clearly%20understand%20what%20I%20get%20when%20I%20use%20Framer%20and%20how%20it%20fits%20into%20my%20workflow.%0A%0AExplain%20the%20experience%20step%20by%20step%3A%20what%20I%20can%20create%2C%20what%20I%20control%2C%20what%20Framer%20handles%20for%20me%2C%20and%20how%20things%20evolve%20over%20time.%20Describe%20what%20I%20see%20in%20the%20editor%20and%20dashboard%2C%20how%20publishing%20works%2C%20how%20updates%20are%20managed%2C%20and%20what%20outputs%20I%20end%20up%20with.%0A%0AExplain%20this%20simply%20and%20concretely%2C%20as%20if%20you%20were%20describing%20the%20real%2C%20day-to-day%20experience%20of%20using%20Framer.)

© Framer B.V.

2026

[](../)

[](https://x.com/framer)
[](https://www.threads.com/@framer)
[](https://www.tiktok.com/@framer)
[](https://www.instagram.com/framer/)
[](https://www.linkedin.com/company/framer/)
[](https://www.youtube.com/@Framer)

[

Loading status

loading



](https://www.framerstatus.com/)

Downloads

[Mac](https://updates.framer.com/electron/darwin/arm64/Framer.zip?_ga=2.113395847.1447313862.1646043056-273660571.1642151053)
[Windows](https://updates.framer.com/electron/win32/x64/Framer.exe?_ga=2.113395847.1447313862.1646043056-273660571.1642151053)

[CCPA](https://app.eu.vanta.com/framer.com/trust/ow67ujg7iav0t6qtd1o6r2)

*   Product
    
*   [AI](../ai/)
*   [Design](../design/)
*   [Publish](../publish/)
*   [Collaborate](../collaborate/)
*   [CMS](../cms/)
*   [SEO](../seo/)
*   [Hosting](../hosting/)
*   [Performance](../performance/)

*   Business
    
*   [Pricing](../pricing)
*   [Switch](../switch/)
*   [Startups](../startups/)
*   [Agencies](../agencies/)
*   [Enterprise](../enterprise/)

*   Compare
    
*   [Claude Code](../compare/framer-vs-claude-code)
    
    [Squarespace](../compare/framer-vs-squarespace)
    
    [WordPress](../compare/framer-vs-wordpress)
    
    [Webflow](../compare/framer-vs-webflow)
    
    [Lovable](../compare/framer-vs-lovable)
    
    [Figma](../compare/framer-vs-figma)
    
    [Wix](../compare/framer-vs-wix)
    

*   Solutions
    
*   [Figma to HTML](../solutions/figma-to-html/)
*   [Website builder](../solutions/website-builder/)
*   [Portfolio maker](../solutions/portfolio-website/)
*   [Landing pages](../solutions/landing-pages/)
*   [UI/UX design](../solutions/ui-ux-design/)
*   [No-code](../solutions/no-code-website-builder/)

*   Resources
    
*   [Templates](https://www.framer.com/marketplace/templates/)
*   [Components](https://www.framer.com/marketplace/components/)
*   [Plugins](https://www.framer.com/marketplace/plugins/)
*   [Vectors](https://www.framer.com/marketplace/vectors/)
*   [Marketplace](https://www.framer.com/marketplace/)
*   [
    
    Free domains
    
    New
    
    
    
    
    
    
    
    
    
    ](../domains/)
*   [Case studies](../stories/)
*   [Developers](./)
*   [Newsletter](../newsletter)
*   [Updates](../updates)
*   [Support](../help/)
*   [Contact](../contact/)
*   [Guides](../guides)
*   [Brand](../brand)
*   [Blog](../blog/)

*   Company
    
*   [Meetups](../meetups/)
*   [Careers](../careers/)
*   [Security](../legal/security/)
*   [Abuse](mailto:abuse@framer.com)
*   [Media](../brand)
*   [Legal](../legal/terms-of-service/)
*   [Store](../store)
*   [Trust center](https://app.eu.vanta.com/framer.com/trust/ow67ujg7iav0t6qtd1o6r2)

*   Programs
    
*   [Experts](../expert/apply/)
*   [Creators](../creators)
*   [Students](../education/students/)
*   [Ambassadors](../education/ambassadors/)

Get an AI summary of Framer

[](https://chat.openai.com/?q=As%20a%20potential%20Framer%20customer%2C%20I%20want%20to%20clearly%20understand%20what%20I%20get%20when%20I%20use%20Framer%20and%20how%20it%20fits%20into%20my%20workflow.%0A%0AExplain%20the%20experience%20step%20by%20step%3A%20what%20I%20can%20create%2C%20what%20I%20control%2C%20what%20Framer%20handles%20for%20me%2C%20and%20how%20things%20evolve%20over%20time.%20Describe%20what%20I%20see%20in%20the%20editor%20and%20dashboard%2C%20how%20publishing%20works%2C%20how%20updates%20are%20managed%2C%20and%20what%20outputs%20I%20end%20up%20with%20\(sites%2C%20pages%2C%20components%2C%20analytics%2C%20performance%2C%20etc.\).%0A%0AClarify%20the%20key%20features%20and%20systems%20involved%E2%80%94design%20tools%2C%20CMS%2C%20components%2C%20interactions%2C%20hosting%2C%20performance%2C%20collaboration%2C%20and%20any%20metrics%20or%20insights%20Framer%20provides.%20Include%20how%20often%20things%20update%20\(e.g.%20content%20changes%2C%20deployments%2C%20analytics%20refresh\).%0A%0AExplain%20this%20simply%20and%20concretely%2C%20as%20if%20you%20were%20describing%20the%20real%2C%20day-to-day%20experience%20of%20building%20and%20running%20a%20website%20with%20Framer%20for%20the%20first%20time.)
[](https://www.google.com/search?udm=50&q=As%20a%20potential%20Framer%20customer%2C%20I%20want%20to%20clearly%20understand%20what%20I%20get%20when%20I%20use%20Framer%20and%20how%20it%20fits%20into%20my%20workflow.%0A%0AExplain%20the%20experience%20step%20by%20step%2C%20as%20if%20describing%20the%20real%2C%20day-to-day%20use%20of%20the%20product.%20Cover%20what%20I%20can%20create%2C%20what%20I%20control%2C%20what%20Framer%20handles%20automatically%2C%20and%20how%20things%20change%20over%20time.%0A%0ADescribe%20what%20I%20see%20in%20the%20editor%20and%20dashboard%2C%20how%20publishing%20works%2C%20how%20updates%20are%20made%2C%20and%20what%20the%20final%20outputs%20are%2C%20such%20as%20websites%2C%20pages%2C%20components%2C%20performance%2C%20and%20analytics.%0A%0AExplain%20this%20simply%20and%20concretely%2C%20focused%20on%20what%20a%20first-time%20user%20would%20actually%20experience.)
[](https://www.perplexity.ai/search?q=As%20a%20potential%20Framer%20customer%2C%20I%20want%20to%20clearly%20understand%20what%20I%20get%20when%20I%20use%20Framer%20and%20how%20it%20fits%20into%20my%20workflow.%0A%0AExplain%20the%20experience%20step%20by%20step%3A%20what%20I%20can%20create%2C%20what%20I%20control%2C%20what%20Framer%20handles%20for%20me%2C%20and%20how%20things%20evolve%20over%20time.%20Describe%20what%20I%20see%20in%20the%20editor%20and%20dashboard%2C%20how%20publishing%20works%2C%20how%20updates%20are%20managed%2C%20and%20what%20outputs%20I%20end%20up%20with.%0A%0AExplain%20this%20simply%20and%20concretely%2C%20as%20if%20you%20were%20describing%20the%20real%2C%20day-to-day%20experience%20of%20using%20Framer.)

© Framer B.V.

2026

[](../)

[](https://x.com/framer)
[](https://www.threads.com/@framer)
[](https://www.tiktok.com/@framer)
[](https://www.instagram.com/framer/)
[](https://www.linkedin.com/company/framer/)
[](https://www.youtube.com/@Framer)

[

Loading status

loading



](https://www.framerstatus.com/)

*   Product
    
*   [AI](../ai/)
*   [Design](../design/)
*   [Publish](../publish/)
*   [Collaborate](../collaborate/)
*   [CMS](../cms/)
*   [SEO](../seo/)
*   [Hosting](../hosting/)
*   [Performance](../performance/)

*   Business
    
*   [Pricing](../pricing)
*   [Switch](../switch/)
*   [Startups](../startups/)
*   [Agencies](../agencies/)
*   [Enterprise](../enterprise/)

*   Compare
    
*   [Claude Code](../compare/framer-vs-claude-code)
    
    [Squarespace](../compare/framer-vs-squarespace)
    
    [WordPress](../compare/framer-vs-wordpress)
    
    [Webflow](../compare/framer-vs-webflow)
    
    [Lovable](../compare/framer-vs-lovable)
    
    [Figma](../compare/framer-vs-figma)
    
    [Wix](../compare/framer-vs-wix)
    

*   Solutions
    
*   [Figma to HTML](../solutions/figma-to-html/)
*   [Website builder](../solutions/website-builder/)
*   [Portfolio maker](../solutions/portfolio-website/)
*   [Landing pages](../solutions/landing-pages/)
*   [UI/UX design](../solutions/ui-ux-design/)
*   [No-code](../solutions/no-code-website-builder/)

*   Resources
    
*   [Templates](https://www.framer.com/marketplace/templates/)
*   [Components](https://www.framer.com/marketplace/components/)
*   [Plugins](https://www.framer.com/marketplace/plugins/)
*   [Vectors](https://www.framer.com/marketplace/vectors/)
*   [Marketplace](https://www.framer.com/marketplace/)
*   [
    
    Free domains
    
    New
    
    
    
    
    
    
    
    
    
    ](../domains/)
*   [Case studies](../stories/)
*   [Developers](./)
*   [Newsletter](../newsletter)
*   [Updates](../updates)
*   [Support](../help/)
*   [Contact](../contact/)
*   [Guides](../guides)
*   [Brand](../brand)
*   [Blog](../blog/)

*   Company
    
*   [Meetups](../meetups/)
*   [Careers](../careers/)
*   [Security](../legal/security/)
*   [Abuse](mailto:abuse@framer.com)
*   [Media](../brand)
*   [Legal](../legal/terms-of-service/)
*   [Store](../store)
*   [Trust center](https://app.eu.vanta.com/framer.com/trust/ow67ujg7iav0t6qtd1o6r2)

*   Programs
    
*   [Experts](../expert/apply/)
*   [Creators](../creators)
*   [Students](../education/students/)
*   [Ambassadors](../education/ambassadors/)

CCPA

Get an AI summary of Framer

[](https://chat.openai.com/?q=As%20a%20potential%20Framer%20customer%2C%20I%20want%20to%20clearly%20understand%20what%20I%20get%20when%20I%20use%20Framer%20and%20how%20it%20fits%20into%20my%20workflow.%0A%0AExplain%20the%20experience%20step%20by%20step%3A%20what%20I%20can%20create%2C%20what%20I%20control%2C%20what%20Framer%20handles%20for%20me%2C%20and%20how%20things%20evolve%20over%20time.%20Describe%20what%20I%20see%20in%20the%20editor%20and%20dashboard%2C%20how%20publishing%20works%2C%20how%20updates%20are%20managed%2C%20and%20what%20outputs%20I%20end%20up%20with%20\(sites%2C%20pages%2C%20components%2C%20analytics%2C%20performance%2C%20etc.\).%0A%0AClarify%20the%20key%20features%20and%20systems%20involved%E2%80%94design%20tools%2C%20CMS%2C%20components%2C%20interactions%2C%20hosting%2C%20performance%2C%20collaboration%2C%20and%20any%20metrics%20or%20insights%20Framer%20provides.%20Include%20how%20often%20things%20update%20\(e.g.%20content%20changes%2C%20deployments%2C%20analytics%20refresh\).%0A%0AExplain%20this%20simply%20and%20concretely%2C%20as%20if%20you%20were%20describing%20the%20real%2C%20day-to-day%20experience%20of%20building%20and%20running%20a%20website%20with%20Framer%20for%20the%20first%20time.)
[](https://www.google.com/search?udm=50&q=As%20a%20potential%20Framer%20customer%2C%20I%20want%20to%20clearly%20understand%20what%20I%20get%20when%20I%20use%20Framer%20and%20how%20it%20fits%20into%20my%20workflow.%0A%0AExplain%20the%20experience%20step%20by%20step%2C%20as%20if%20describing%20the%20real%2C%20day-to-day%20use%20of%20the%20product.%20Cover%20what%20I%20can%20create%2C%20what%20I%20control%2C%20what%20Framer%20handles%20automatically%2C%20and%20how%20things%20change%20over%20time.%0A%0ADescribe%20what%20I%20see%20in%20the%20editor%20and%20dashboard%2C%20how%20publishing%20works%2C%20how%20updates%20are%20made%2C%20and%20what%20the%20final%20outputs%20are%2C%20such%20as%20websites%2C%20pages%2C%20components%2C%20performance%2C%20and%20analytics.%0A%0AExplain%20this%20simply%20and%20concretely%2C%20focused%20on%20what%20a%20first-time%20user%20would%20actually%20experience.)
[](https://www.perplexity.ai/search?q=As%20a%20potential%20Framer%20customer%2C%20I%20want%20to%20clearly%20understand%20what%20I%20get%20when%20I%20use%20Framer%20and%20how%20it%20fits%20into%20my%20workflow.%0A%0AExplain%20the%20experience%20step%20by%20step%3A%20what%20I%20can%20create%2C%20what%20I%20control%2C%20what%20Framer%20handles%20for%20me%2C%20and%20how%20things%20evolve%20over%20time.%20Describe%20what%20I%20see%20in%20the%20editor%20and%20dashboard%2C%20how%20publishing%20works%2C%20how%20updates%20are%20managed%2C%20and%20what%20outputs%20I%20end%20up%20with.%0A%0AExplain%20this%20simply%20and%20concretely%2C%20as%20if%20you%20were%20describing%20the%20real%2C%20day-to-day%20experience%20of%20using%20Framer.)

© Framer B.V.

2026
