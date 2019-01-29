import {GraphQLNonNull, GraphQLString} from 'graphql'
import getRethink from 'server/database/rethinkDriver'
import {requireSU} from 'server/utils/authorization'
import publish from 'server/utils/publish'
import shortid from 'shortid'
import {NOTIFICATION} from 'universal/utils/constants'
import AddNewFeaturePayload from '../../types/addNewFeaturePayload'

const addNewFeature = {
  type: AddNewFeaturePayload,
  description: 'broadcast a new feature to the entire userbase',
  args: {
    copy: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The text body of the new feature'
    }
  },
  resolve: async (_source, {copy}, {authToken, dataLoader}) => {
    const r = getRethink()

    // AUTH
    requireSU(authToken)
    const operationId = dataLoader.share()
    const subOptions = {operationId}

    // RESOLUTION
    const newFeatureId = shortid.generate()
    const newFeature = {
      id: newFeatureId,
      copy
    }
    await r({
      newFeature: r.table('NewFeature').insert(newFeature),
      userUpdate: r.table('User').update({
        newFeatureId
      })
    })

    const onlineUserIds = await r.table('User').filter((user) =>
      user('connectedSockets')
        .count()
        .ge(1)
    )('id')
    onlineUserIds.forEach((userId) => {
      publish(NOTIFICATION, userId, AddNewFeaturePayload, {newFeature}, subOptions)
    })
    return {newFeature}
  }
}

export default addNewFeature
