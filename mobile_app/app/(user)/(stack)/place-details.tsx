import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function PlaceDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Parse the place data from params
  const place = {
    id: params.id as string,
    name: params.name as string,
    description: params.description as string,
    distance: params.distance as string,
    rating: params.rating ? parseFloat(params.rating as string) : undefined,
    category: params.category as string,
    imageUrl: params.imageUrl as string | undefined,
    modelPath: params.modelPath as string | undefined,
  };

  const handleOpenImmersiveView = () => {
    if (place.modelPath) {
      const url = `https://models.shrishesha.space/viewer/${place.modelPath.toLowerCase()}.glb`;
      Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Header */}
        <View style={styles.imageContainer}>
          {place.imageUrl ? (
            <Image
              source={{ uri: place.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <IconSymbol name="map.fill" size={64} color="#0a7ea4" />
            </View>
          )}
          
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="#11181C" />
          </TouchableOpacity>
        </View>

        {/* Place Details */}
        <View style={styles.content}>
          {/* Title and Rating */}
          <View style={styles.header}>
            <Text style={styles.name}>{place.name}</Text>
            {place.rating && (
              <View style={styles.ratingContainer}>
                <IconSymbol name="star.fill" size={20} color="#fbbf24" />
                <Text style={styles.rating}>{place.rating}</Text>
              </View>
            )}
          </View>

          {/* Category and Distance */}
          <View style={styles.metaInfo}>
            <View style={styles.categoryContainer}>
              <IconSymbol name="tag.fill" size={16} color="#687076" />
              <Text style={styles.category}>{place.category}</Text>
            </View>
            <View style={styles.distanceContainer}>
              <IconSymbol name="location.fill" size={16} color="#687076" />
              <Text style={styles.distance}>{place.distance}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{place.description}</Text>
          </View>

          {/* Immersive View Button */}
          {place.modelPath && (
            <TouchableOpacity 
              style={styles.immersiveButton}
              onPress={handleOpenImmersiveView}
              activeOpacity={0.8}
            >
              <IconSymbol name="cube.fill" size={24} color="#fff" />
              <Text style={styles.immersiveButtonText}>Open Immersive 3D View</Text>
              <IconSymbol name="arrow.right" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Additional Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <IconSymbol name="clock.fill" size={20} color="#0a7ea4" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Visiting Hours</Text>
                <Text style={styles.detailValue}>Open daily: 6:00 AM - 6:00 PM</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <IconSymbol name="ticket.fill" size={20} color="#0a7ea4" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Entry Fee</Text>
                <Text style={styles.detailValue}>Free / Donations welcome</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <IconSymbol name="info.circle.fill" size={20} color="#0a7ea4" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Best Time to Visit</Text>
                <Text style={styles.detailValue}>March to June, September to December</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol name="map.fill" size={22} color="#0a7ea4" />
              <Text style={styles.actionButtonText}>Directions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol name="heart" size={22} color="#0a7ea4" />
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol name="square.and.arrow.up" size={22} color="#0a7ea4" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f4f8',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#11181C',
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rating: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11181C',
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  category: {
    fontSize: 14,
    color: '#687076',
    fontWeight: '500',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distance: {
    fontSize: 14,
    color: '#687076',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#687076',
    lineHeight: 24,
  },
  immersiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a7ea4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    elevation: 4,
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  immersiveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#687076',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#0a7ea4',
    fontWeight: '600',
  },
});
