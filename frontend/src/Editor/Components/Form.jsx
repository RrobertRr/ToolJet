import React, { useRef, useState, useEffect } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';

export const Form = function Form(props) {
  const {
    id,
    component,
    width,
    height,
    containerProps,
    removeComponent,
    styles,
    setExposedVariable,
    darkMode,
    currentState,
    fireEvent,
    properties,
  } = props;
  const { visibility, disabledState, borderRadius, borderColor } = styles;
  const { buttonToSubmit } = properties;
  const backgroundColor =
    ['#fff', '#ffffffff'].includes(styles.backgroundColor) && darkMode ? '#232E3C' : styles.backgroundColor;
  const computedStyles = {
    backgroundColor,
    borderRadius: borderRadius ? parseFloat(borderRadius) : 0,
    border: `1px solid ${borderColor}`,
    height,
    display: visibility ? 'flex' : 'none',
  };

  const parentRef = useRef(null);
  const childDataRef = useRef({});

  const [childrenData, setChildrenData] = useState({});
  const [isValid, setValidation] = useState(true);

  useEffect(() => {
    setExposedVariable('data', {});
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const formattedChildData = {};
    let childValidation = true;
    Object.keys(childrenData).forEach((childId) => {
      if (childrenData[childId]?.name) {
        formattedChildData[childrenData[childId].name] = childrenData[childId]?.value ?? '';
        childValidation = childValidation && (childrenData[childId]?.isValid ?? true);
      }
    });
    setExposedVariable('data', formattedChildData);
    setExposedVariable('isValid', childValidation);
    setValidation(childValidation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenData]);

  useEffect(() => {
    const childIds = Object.keys(childrenData);
    Object.entries(currentState.components).forEach(([name, value]) => {
      if (childIds.includes(value.id) && name !== childrenData[value.id]?.name) {
        childDataRef.current = {
          ...childDataRef.current,
          [value.id]: { ...childDataRef.current[value.id], name: name },
        };
      }
    });
    if (Object.keys(diff(childrenData, childDataRef.current).length !== 0)) {
      setChildrenData(childDataRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState.components]);

  useEffect(() => {
    document.addEventListener('submitForm', handleFormSubmission);
    return () => document.removeEventListener('submitForm', handleFormSubmission);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buttonToSubmit, isValid]);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const handleFormSubmission = ({ detail: { buttonComponentId } }) => {
    if (buttonToSubmit === buttonComponentId) {
      if (isValid) {
        fireEvent('onSubmit');
      } else {
        fireEvent('onInvalid');
      }
    }
  };

  // const cancelCourse = () => {
  //   parentRef.reset();
  // };

  return (
    <form
      data-disabled={disabledState}
      className="jet-container"
      id={id}
      ref={parentRef}
      style={computedStyles}
      onSubmit={handleSubmit}
      onClick={(e) => {
        if (e.target.className === 'real-canvas') containerProps.onComponentClick(id, component);
      }} //Hack, should find a better solution - to prevent losing z index when container element is clicked
    >
      <SubContainer
        parentComponent={component}
        containerCanvasWidth={width}
        parent={id}
        {...containerProps}
        parentRef={parentRef}
        removeComponent={removeComponent}
        onOptionChange={function ({ component, optionName, value, componentId }) {
          if (componentId) {
            const optionData = {
              ...(childDataRef.current[componentId] ?? {}),
              name: component.name,
              [optionName]: value,
            };
            childDataRef.current = { ...childDataRef.current, [componentId]: optionData };
            setChildrenData(childDataRef.current);
          }
        }}
      />
      <SubCustomDragLayer
        containerCanvasWidth={width}
        parent={id}
        parentRef={parentRef}
        currentLayout={containerProps.currentLayout}
      />
      {/* <button onClick={cancelCourse}>Reset</button> */}
    </form>
  );
};
