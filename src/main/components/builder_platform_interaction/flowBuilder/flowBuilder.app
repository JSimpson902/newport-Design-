<aura:application
    extends="force:sldsDynamic"
    description="Lightning Flow Builder"
    access="accessCheck://Interaction.userCanEditDesigner"
    template="builder_platform_interaction:flowBuilderTemplate"
    flavorOverrides="one:one"
>
    <!--Attributes -->
    <aura:attribute name="flowId" type="String" default="" description="The id of the flow to load" />
    <aura:attribute
        name="flowDefId"
        type="String"
        description="The id of the flow definition associated with the flow we are loading"
    />
    <aura:attribute
        name="guid"
        type="String"
        description="The guid of the saved flow interview to debug in the builder"
    />
    <aura:attribute name="builderType" type="String" description="Flow builder type: FlowBuilder, JourneyBuilder etc" />
    <aura:attribute name="builderConfig" type="Object" description="Configuration for the current builder type" />
    <aura:attribute name="complianceBannerEnabled" type="Boolean" description="Is Compliance Banner org perm enabled" />

    <aura:attribute name="ready" type="Boolean" access="private" description="Flag used to render the editor." />

    <aura:handler name="init" value="{!this}" action="{!c.onInit}" />
    <aura:handler event="aura:systemError" action="{!c.handleSystemError}"/>
    <aura:handler event="aura:customerError" action="{!c.handleCustomerError}"/>

    <!--Temp fix: Till we can leverage wire to get data-->
    <builder_platform_interaction:serverDataLibInit
        aura:id="serverDataLibInit"
    ></builder_platform_interaction:serverDataLibInit>

    <builder_platform_interaction:builderUtils aura:id="builderUtils"/> 

    <builder_platform_interaction:contextLib aura:id="contextLib"></builder_platform_interaction:contextLib>

    <builder_platform_interaction:imageLib aura:id="imageLib"></builder_platform_interaction:imageLib>

    <aura:if isTrue="{!v.ready}">
        <builder_platform_interaction:guardrailsManager consumerId="flowbuilder">
            <builder_platform_interaction:container
                flowId="{!v.flowId}"
                flowDefId="{!v.flowDefId}"
                interviewGuid="{!v.guid}"
                builderType="{!v.builderType}"
                builderConfig="{!v.builderConfig}"
                complianceBannerEnabled="{!v.complianceBannerEnabled}"
            ></builder_platform_interaction:container>
        </builder_platform_interaction:guardrailsManager>
    </aura:if>

    <!-- panel manager component with custom css -->
    <builder_platform_interaction:panelManagerWrapper />

    <!-- Metrics Service beacon  -->
    <instrumentation:beacon></instrumentation:beacon>
</aura:application>
