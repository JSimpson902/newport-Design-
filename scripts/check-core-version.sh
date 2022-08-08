#/bin/sh

# Usage: check-core-version.sh  BRANCH CL
# eg: check-stm-version.sh
#     check-stm-version.sh main 32818692

LIGHT_GRAY='\033[0;37m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NO_COLOR='\033[0m' # No Color

RELEASE_VERSION_REGEXP='[0-9]+.[0-9]+'
COMMIT_HASH_REGEXP='\b([a-f0-9]{40})\b'
GUS_WI_REGEXP='W\-[0-9]{8}'
PR_ID_REGEXP='#[0-9]{4}'

BAZEL_RELATIVE_PATH=third_party/dependencies/sfdc_ui.bzl
JAR_NAME=_UI_INTERACTION_BUILDER_COMPONENTS_VERSION
SWARM_CHANGES_BASE_URL='https://swarm.soma.salesforce.com/changes/'
GUS_WORK_ITEM_BASE_URL='https://gus.my.salesforce.com/apex/ADM_WorkLocator?bugorworknumber='
NEXUS_JAR_BASE_URL='https://nexus.soma.salesforce.com/nexus/content/groups/public/sfdc/ui/ui-interaction-builder-components/'

BRANCH=$1
CL=$2

if [ -z "$BRANCH" ]; then
    BRANCH=main
fi

if [ -z "$CL" ]; then
    CL=$(p4 changes -m 1 | cut -f2 -d" ")
fi

TAG=$(p4 print //app/$BRANCH/core/$BAZEL_RELATIVE_PATH@$CL | grep $JAR_NAME | grep -Eo $RELEASE_VERSION_REGEXP)

COMMIT=$(git show --format="Author: %an (%ad)%nTitle: %s%nCommit hash: %H" -s sfci-$TAG | sed -n '/Author:/,$p')
COMMIT_HASH=$(echo "$COMMIT" | grep -Eo $COMMIT_HASH_REGEXP)
PR_ID=$(echo "$COMMIT" | grep -Eo $PR_ID_REGEXP)
GUS_WORK_ITEM=$(echo "$COMMIT" | grep -Eo $GUS_WI_REGEXP)
# We do retrieve the origin Git URL and remove the trailing .git part
GIT_URL=$(git remote get-url origin | rev | cut -c5- | rev)

echo "Branch: ${LIGHT_GRAY}$BRANCH${NO_COLOR}"
echo "Latest ui-interaction-builder-components jar version: ${GREEN}$TAG${NO_COLOR}"
echo "Latest P4 changelist: ${BLUE}$CL ($SWARM_CHANGES_BASE_URL$CL)${NO_COLOR}\n"

echo "${LIGHT_GRAY}Related Git release commit details:${NO_COLOR}"
echo "$COMMIT"
echo "Commit URL: $GIT_URL/commit/$COMMIT_HASH"
if [ -z $PR_ID ]; then
    echo "No PR ID provided in the commit message\n"
else
    echo "PR URL: $GIT_URL/pull/${PR_ID//#/}" # removing # char from grabbed Pull Request ID
fi

if [ -z $GUS_WORK_ITEM ]; then
    echo "No WorkItem provided in the commit message"
else
    echo "GUS WorkItem: $GUS_WORK_ITEM_BASE_URL$GUS_WORK_ITEM"
fi
echo "Nexus URL: $NEXUS_JAR_BASE_URL$TAG/\n"
