import graphql from 'babel-plugin-relay/macro'
import React from 'react'
import {createPaginationContainer, RelayPaginationProp} from 'react-relay'
import {ParabolScopingSearchResults_viewer} from '../__generated__/ParabolScopingSearchResults_viewer.graphql'
import ParabolScopingSelectAllIssues from './ParabolScopingSelectAllIssues'
import ParabolScopingSearchResultItem from './ParabolScopingSearchResultItem'
interface Props {
  relay: RelayPaginationProp
  viewer: ParabolScopingSearchResults_viewer
}

const ParabolScopingSearchResults = (props: Props) => {
  const {viewer} = props
  const edges = viewer.tasks.edges
  const tasks = edges.map(({node}) => node)

  // TODO: add total count returned to connection e.g. connection {count, pageInfo, edges}
  return (
    <>
      <ParabolScopingSelectAllIssues selected={false} issueCount={5} />
      {tasks.map((task) => {
        return <ParabolScopingSearchResultItem key={task.id} item={task} />
      })}
    </>
  )
}

export default createPaginationContainer(
  ParabolScopingSearchResults,
  {
    viewer: graphql`
      fragment ParabolScopingSearchResults_viewer on User {
        tasks(first: $first, after: $after, userIds: $userIds, teamIds: $teamIds, archived: false)
          @connection(key: "ParabolScopingSearchResults_tasks") {
          edges {
            cursor
            node {
              ...ParabolScopingSearchResultItem_item
              __typename
              id
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `
  },
  {
    direction: 'forward',
    getConnectionFromProps(props) {
      return props.viewer && props.viewer.tasks
    },
    getFragmentVariables(prevVars, totalCount) {
      return {
        ...prevVars,
        first: totalCount
      }
    },
    getVariables(_, {count, cursor}, fragmentVariables) {
      return {
        ...fragmentVariables,
        first: count,
        after: cursor
      }
    },
    query: graphql`
      query ParabolScopingSearchResultsPaginationQuery(
        $first: Int!
        $after: DateTime
        $teamIds: [ID!]
        $userIds: [ID!]
      ) {
        viewer {
          ...ParabolScopingSearchResults_viewer
        }
      }
    `
  }
)
