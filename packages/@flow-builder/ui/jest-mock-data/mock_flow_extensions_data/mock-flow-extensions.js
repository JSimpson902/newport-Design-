// see flowExtension.createdescription
export const mockFlowRuntimeEmailFlowExtensionDescription = {
  name: "flowruntime:email",
  inputParameters: [
    {
      apiName: "disabled",
      dataType: "boolean",
      description: "Prevents the user from modifying or copying the value.",
      hasDefaultValue: true,
      isRequired: false,
      label: "Disabled",
      isInput: true,
      isOutput: true,
      maxOccurs: 1,
      defaultValue: "$GlobalConstant.False"
    },
    {
      apiName: "label",
      dataType: "string",
      description: "The label that appears above the email field.",
      hasDefaultValue: true,
      isRequired: true,
      label: "Label",
      isInput: true,
      isOutput: true,
      maxOccurs: 1,
      defaultValue: "Email"
    },
    {
      apiName: "placeholder",
      dataType: "string",
      description:
        "Text that appears in the field when it's empty. Use placeholder text to give users a hint about what to enter in the field.",
      hasDefaultValue: true,
      isRequired: false,
      label: "Placeholder Text",
      isInput: true,
      isOutput: true,
      maxOccurs: 1,
      defaultValue: "you@example.com"
    },
    {
      apiName: "readonly",
      dataType: "boolean",
      description:
        "Prevents the user from modifying the value, but not from copying it.",
      hasDefaultValue: true,
      isRequired: false,
      label: "Read Only",
      isInput: true,
      isOutput: true,
      maxOccurs: 1,
      defaultValue: "$GlobalConstant.False"
    },
    {
      apiName: "required",
      dataType: "boolean",
      description: "Requires the user to enter a value.",
      hasDefaultValue: true,
      isRequired: false,
      label: "Required",
      isInput: true,
      isOutput: true,
      maxOccurs: 1,
      defaultValue: "$GlobalConstant.False"
    },
    {
      apiName: "value",
      dataType: "string",
      description:
        "To provide a default value, set this attribute's value. To use the user-entered value elsewhere in your flow, store this attribute's output value in a variable.",
      hasDefaultValue: true,
      isRequired: false,
      label: "Value",
      isInput: true,
      isOutput: true,
      maxOccurs: 1
    }
  ],
  outputParameters: [
    {
      apiName: "disabled",
      dataType: "boolean",
      description: "Prevents the user from modifying or copying the value.",
      hasDefaultValue: true,
      isRequired: false,
      label: "Disabled",
      isInput: true,
      isOutput: true,
      maxOccurs: 1,
      defaultValue: "$GlobalConstant.False"
    },
    {
      apiName: "label",
      dataType: "string",
      description: "The label that appears above the email field.",
      hasDefaultValue: true,
      isRequired: true,
      label: "Label",
      isInput: true,
      isOutput: true,
      maxOccurs: 1,
      defaultValue: "Email"
    },
    {
      apiName: "placeholder",
      dataType: "string",
      description:
        "Text that appears in the field when it's empty. Use placeholder text to give users a hint about what to enter in the field.",
      hasDefaultValue: true,
      isRequired: false,
      label: "Placeholder Text",
      isInput: true,
      isOutput: true,
      maxOccurs: 1,
      defaultValue: "you@example.com"
    },
    {
      apiName: "readonly",
      dataType: "boolean",
      description:
        "Prevents the user from modifying the value, but not from copying it.",
      hasDefaultValue: true,
      isRequired: false,
      label: "Read Only",
      isInput: true,
      isOutput: true,
      maxOccurs: 1,
      defaultValue: "$GlobalConstant.False"
    },
    {
      apiName: "required",
      dataType: "boolean",
      description: "Requires the user to enter a value.",
      hasDefaultValue: true,
      isRequired: false,
      label: "Required",
      isInput: true,
      isOutput: true,
      maxOccurs: 1,
      defaultValue: "$GlobalConstant.False"
    },
    {
      apiName: "value",
      dataType: "string",
      description:
        "To provide a default value, set this attribute's value. To use the user-entered value elsewhere in your flow, store this attribute's output value in a variable.",
      hasDefaultValue: true,
      isRequired: false,
      label: "Value",
      isInput: true,
      isOutput: true,
      maxOccurs: 1
    }
  ]
};

export const mockLightningCompWithAccountOutputFlowExtensionDescription = {
  name: "c:HelloWorld",
  inputParameters: [
    {
      apiName: "account",
      dataType: "sobject",
      subtype: "Account",
      hasDefaultValue: false,
      isRequired: false,
      label: "Account",
      isInput: true,
      isOutput: true,
      maxOccurs: 1
    },
    {
      apiName: "greeting",
      dataType: "string",
      hasDefaultValue: false,
      isRequired: false,
      label: "Greeting",
      isInput: true,
      isOutput: true,
      maxOccurs: 1
    },
    {
      apiName: "subject",
      dataType: "string",
      hasDefaultValue: false,
      isRequired: false,
      label: "Subject",
      isInput: true,
      isOutput: true,
      maxOccurs: 1
    }
  ],
  outputParameters: [
    {
      apiName: "account",
      dataType: "sobject",
      subtype: "Account",
      hasDefaultValue: false,
      isRequired: false,
      label: "Account",
      isInput: true,
      isOutput: true,
      maxOccurs: 1
    },
    {
      apiName: "greeting",
      dataType: "string",
      hasDefaultValue: false,
      isRequired: false,
      label: "Greeting",
      isInput: true,
      isOutput: true,
      maxOccurs: 1
    },
    {
      apiName: "subject",
      dataType: "string",
      hasDefaultValue: false,
      isRequired: false,
      label: "Subject",
      isInput: true,
      isOutput: true,
      maxOccurs: 1
    }
  ]
};

export const mockLightningCompWithoutSObjectOutputFlowExtensionDescription = {
  name: "c:noSobjectOutputComp",
  inputParameters: [
    {
      apiName: "greeting",
      dataType: "string",
      hasDefaultValue: false,
      isRequired: false,
      label: "Greeting",
      isInput: true,
      isOutput: true,
      maxOccurs: 1
    },
    {
      apiName: "subject",
      dataType: "string",
      hasDefaultValue: false,
      isRequired: false,
      label: "Subject",
      isInput: true,
      isOutput: true,
      maxOccurs: 1
    }
  ],
  outputParameters: [
    {
      apiName: "greeting",
      dataType: "string",
      hasDefaultValue: false,
      isRequired: false,
      label: "Greeting",
      isInput: true,
      isOutput: true,
      maxOccurs: 1
    },
    {
      apiName: "subject",
      dataType: "string",
      hasDefaultValue: false,
      isRequired: false,
      label: "Subject",
      isInput: true,
      isOutput: true,
      maxOccurs: 1
    }
  ]
};
