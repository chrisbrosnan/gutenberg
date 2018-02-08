/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Reducer enhancer which transforms the result of the original reducer into an
 * object tracking its own history (past, present, future).
 *
 * @param {Function} reducer            Original reducer.
 * @param {?Object}  options            Optional options.
 * @param {?Array}   options.resetTypes Action types upon which to clear past.
 *
 * @return {Function} Enhanced reducer.
 */
export default function withHistory( reducer, options = {} ) {
	const initialState = {
		past: [],
		present: reducer( undefined, {} ),
		buffer: reducer( undefined, {} ),
		future: [],
	};

	return ( state = initialState, action ) => {
		const { past, present, buffer, future } = state;

		switch ( action.type ) {
			case 'UNDO':
				// If there are changes in buffer, push buffer to the future.
				if ( present !== buffer ) {
					return {
						past: past.slice( 0, past.length - 1 ),
						present,
						buffer: present,
						future: [ buffer, ...future ],
					};
				}

				// Can't undo if no past.
				if ( ! past.length ) {
					return state;
				}

				return {
					past: past.slice( 0, past.length - 1 ),
					present: past[ past.length - 1 ],
					buffer: past[ past.length - 1 ],
					future: [ present, ...future ],
				};

			case 'REDO':
				// Can't redo if no future.
				if ( ! future.length ) {
					return state;
				}

				return {
					past: [ ...past, present ],
					present: future[ 0 ],
					buffer: future[ 0 ],
					future: future.slice( 1 ),
				};

			case 'CREATE_UNDO_LEVEL':
				// Already has this level.
				if ( present === buffer ) {
					return state;
				}

				return {
					past: [ ...past, present ],
					present: buffer,
					buffer,
					future: [],
				};
		}

		const nextBuffer = reducer( buffer, action );

		if ( includes( options.resetTypes, action.type ) ) {
			return {
				past: [],
				present: nextBuffer,
				buffer: nextBuffer,
				future: [],
			};
		}

		if ( buffer === nextBuffer ) {
			return state;
		}

		return {
			past,
			present,
			buffer: nextBuffer,
			future,
		};
	};
}
